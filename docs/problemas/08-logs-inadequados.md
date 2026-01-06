# Problema 08: Logs e Tratamento de Erros Inadequados

## 🔍 Descrição do Problema

Os controllers usam `console.error()` e `console.log()` para logging, e expõem erros genéricos ao cliente, dificultando debug e potencialmente expondo informações sensíveis.

**Localização:** Diversos controllers

```javascript
exports.create = async (req, res) => {
  try {
    // ...
  } catch (error) {
    console.error(error);  // ❌ Log sem contexto
    res.status(500).json({ erro: 'Erro ao criar o post.' });  // ❌ Mensagem genérica
  }
};
```

**No [server.js](../server.js):**

```javascript
db.sequelize.authenticate()
  .then(() => {
    console.log('Conectado ao banco com sucesso!');  // ❌ console.log
  })
  .catch(err => {
    console.error('Erro ao conectar com o banco:', err);  // ❌ console.error
  });
```

## ⚠️ Por Que É Um Problema?

1. **Dificuldade de Debug**: Logs sem contexto (timestamp, nível, request ID) são difíceis de rastrear.

2. **Exposição de Dados Sensíveis**: Stack traces podem conter senhas, tokens ou dados pessoais.

3. **Sem Rastreabilidade**: Impossível correlacionar logs com requisições específicas.

4. **Produção vs Desenvolvimento**: Não há diferenciação de logging entre ambientes.

5. **Sem Centralização**: Logs espalhados dificultam monitoramento.

6. **Mensagens Genéricas**: Usuários não sabem o que deu errado.

## 🛠️ Como Resolver

### Passo 1: Instalar Biblioteca de Logging

```bash
npm install winston
```

### Passo 2: Configurar Winston

**Criar arquivo:** `src/config/logger.config.js`

```javascript
const winston = require('winston');
const path = require('path');
const { env } = require('../common/env');

// ✅ Formato customizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Adiciona metadados se houver
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // Adiciona stack trace se houver
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// ✅ Transports (onde os logs vão)
const transports = [];

// Console (sempre ativo)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  })
);

// Arquivo de erros (produção)
if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Arquivo geral (produção)
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'combined.log'),
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// ✅ Criar logger
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports,
  exitOnError: false
});

module.exports = logger;
```

### Passo 3: Criar Middleware de Request Logging

**Criar arquivo:** `src/middlewares/requestLogger.middleware.js`

```javascript
const logger = require('../config/logger.config');
const crypto = require('crypto');

/**
 * Middleware que loga todas as requisições
 */
exports.requestLogger = (req, res, next) => {
  // ✅ Gerar ID único para correlacionar logs
  req.id = crypto.randomUUID();
  
  const start = Date.now();

  // ✅ Log da requisição
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // ✅ Interceptar resposta
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    
    const duration = Date.now() - start;
    
    logger.info('Response sent', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });

    return res.send(data);
  };

  next();
};
```

### Passo 4: Criar Middleware de Error Handling

**Criar arquivo:** `src/middlewares/errorHandler.middleware.js`

```javascript
const logger = require('../config/logger.config');
const { env } = require('../common/env');

/**
 * Middleware centralizado de tratamento de erros
 */
exports.errorHandler = (err, req, res, next) => {
  // ✅ Log do erro
  logger.error('Error occurred', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: err.stack,
    usuario: req.usuario?.id
  });

  // ✅ Erros conhecidos
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: err.errors.map(e => ({
        campo: e.path,
        mensagem: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      erro: 'Registro duplicado',
      detalhes: err.errors.map(e => ({
        campo: e.path,
        mensagem: `${e.path} já existe`
      }))
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ erro: 'Token inválido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ erro: 'Token expirado' });
  }

  // ✅ Erro genérico
  const statusCode = err.statusCode || 500;
  const message = env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor'
    : err.message;

  res.status(statusCode).json({
    erro: message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para rotas não encontradas
 */
exports.notFoundHandler = (req, res, next) => {
  logger.warn('Route not found', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl
  });

  res.status(404).json({
    erro: 'Rota não encontrada',
    path: req.originalUrl
  });
};
```

### Passo 5: Aplicar Middlewares no App

**Arquivo:** [src/app.js](../src/app.js)

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./config/logger.config');
const { requestLogger } = require('./middlewares/requestLogger.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler.middleware');
const { sanitizeBody } = require('./middlewares/sanitize.middleware');

const app = express();

const postsRoutes = require('./routes/posts.routes');
const authRoutes = require('./routes/auth.routes');

// ✅ CORS configurado corretamente
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:8080'];
    
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Sanitização
app.use(sanitizeBody);

// ✅ Logger de requisições
app.use(requestLogger);

// ✅ Arquivos estáticos
app.use('/uploads/posts', express.static(path.join(__dirname, '..', 'public', 'uploads', 'posts')));

// ✅ Rotas
app.use('/posts', postsRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  logger.info('Health check accessed');
  res.send('API do Tech Challenge está rodando!');
});

// ✅ Rota não encontrada
app.use(notFoundHandler);

// ✅ Error handler (deve ser o último)
app.use(errorHandler);

module.exports = app;
```

### Passo 6: Atualizar Server.js

**Arquivo:** [server.js](../server.js)

```javascript
const app = require('./src/app');
const db = require('./src/models');
const { env } = require('./src/common/env');
const logger = require('./src/config/logger.config');

// ✅ Tratar erros não capturados
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// ✅ Conectar banco e iniciar servidor
db.sequelize.authenticate()
  .then(() => {
    logger.info('Database connected successfully');
    return db.sequelize.sync({ alter: env.NODE_ENV !== 'production' });
  })
  .then(() => {
    logger.info('Database models synchronized');
    
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // ✅ Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, closing server gracefully');
      server.close(() => {
        logger.info('Server closed');
        db.sequelize.close().then(() => {
          logger.info('Database connection closed');
          process.exit(0);
        });
      });
    });
  })
  .catch(err => {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  });
```

### Passo 7: Atualizar Controllers

**Exemplo:** [src/controllers/posts.controller.js](../src/controllers/posts.controller.js)

```javascript
const db = require('../models');
const Post = db.Post;
const Usuario = db.Usuario;
const { Op } = require('sequelize');
const logger = require('../config/logger.config');

exports.getAll = async (req, res, next) => {
  try {
    logger.debug('Fetching all posts', { requestId: req.id });
    
    const posts = await Post.findAll({
      order: [['data_criacao', 'DESC']],
      include: { model: Usuario, attributes: ['id', 'nome', 'email'] }
    });
    
    logger.info('Posts fetched successfully', { 
      requestId: req.id, 
      count: posts.length 
    });
    
    res.status(200).json(posts);
  } catch (err) {
    next(err);  // ✅ Passa para error handler
  }
};

exports.create = async (req, res, next) => {
  try {
    const { titulo, conteudo, materia } = req.body;
    const usuario_id = req.usuario.id;
    const imagem = req.file ? req.file.filename : null;

    logger.debug('Creating new post', { 
      requestId: req.id, 
      usuario_id, 
      titulo 
    });

    const novoPost = await Post.create({ 
      titulo, 
      conteudo, 
      usuario_id, 
      imagem, 
      materia 
    });
    
    logger.info('Post created successfully', { 
      requestId: req.id, 
      postId: novoPost.id,
      usuario_id 
    });
    
    res.status(201).json(novoPost);
  } catch (error) {
    next(error);  // ✅ Passa para error handler
  }
};
```

## ✅ Solução Implementada

Após a implementação:

- ✅ **Logs estruturados** com Winston
- ✅ **Request ID** para correlacionar logs
- ✅ **Níveis de log** (debug, info, warn, error)
- ✅ **Rotação de arquivos** em produção
- ✅ **Error handler centralizado**
- ✅ **Graceful shutdown**
- ✅ **Sem exposição de dados sensíveis**

## 🔐 Boas Práticas Adicionais

### 1. Integração com Serviços de Monitoramento

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 2. Métricas e Performance

```bash
npm install prom-client
```

### 3. Logs Estruturados em JSON (para ELK, Datadog)

```javascript
format: winston.format.json()
```

## 📚 Referências

- [Winston Documentation](https://github.com/winstonjs/winston)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
