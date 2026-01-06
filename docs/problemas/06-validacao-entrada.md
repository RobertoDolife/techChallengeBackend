# Problema 06: SQL Injection e Validação de Entrada

## 🔍 Descrição do Problema

Os controllers **não validam** adequadamente os dados de entrada antes de processá-los, e embora o Sequelize ofereça proteção contra SQL Injection, faltam validações de negócio.

**Localização:** [src/controllers/posts.controller.js](../src/controllers/posts.controller.js) e [src/controllers/auth.controller.js](../src/controllers/auth.controller.js)

```javascript
// ❌ Sem validação de entrada
exports.create = async (req, res) => {
  const { titulo, conteudo, usuario_id, materia } = req.body;
  if (!titulo || !usuario_id) {  // ✅ Valida presença, mas não formato
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
  }
  // ...
};

// ❌ Busca sem sanitização
exports.search = async (req, res) => {
  const termo = req.query.q;  // ❌ Aceita qualquer valor
  if (!termo) return res.status(400).json({ erro: 'Termo de busca ausente' });
  // ...
};
```

## ⚠️ Por Que É Um Problema?

1. **Dados Inválidos**: Usuários podem enviar strings vazias, números negativos, ou valores inesperados.

2. **XSS (Cross-Site Scripting)**: Sem sanitização, scripts maliciosos podem ser armazenados e executados.

3. **Tamanho Descontrolado**: Campos podem exceder limites do banco de dados.

4. **Falta de Consistência**: Validações espalhadas pelo código são difíceis de manter.

5. **Erros Genéricos**: Sem validação adequada, erros do banco são expostos ao usuário.

## 🛠️ Como Resolver

### Passo 1: Criar Schemas de Validação com Zod

**Criar arquivo:** `src/validators/post.validator.js`

```javascript
const { z } = require('zod');

exports.createPostSchema = z.object({
  titulo: z.string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(60, 'Título deve ter no máximo 60 caracteres')
    .trim(),
  
  conteudo: z.string()
    .max(1000, 'Conteúdo deve ter no máximo 1000 caracteres')
    .trim()
    .optional(),
  
  materia: z.string()
    .max(100, 'Matéria deve ter no máximo 100 caracteres')
    .trim()
    .optional()
});

exports.updatePostSchema = z.object({
  titulo: z.string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(60, 'Título deve ter no máximo 60 caracteres')
    .trim()
    .optional(),
  
  conteudo: z.string()
    .max(1000, 'Conteúdo deve ter no máximo 1000 caracteres')
    .trim()
    .optional(),
  
  materia: z.string()
    .max(100, 'Matéria deve ter no máximo 100 caracteres')
    .trim()
    .optional()
});

exports.searchPostSchema = z.object({
  q: z.string()
    .min(1, 'Termo de busca não pode ser vazio')
    .max(100, 'Termo de busca muito longo')
    .trim()
});
```

**Criar arquivo:** `src/validators/auth.validator.js`

```javascript
const { z } = require('zod');

exports.loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .toLowerCase()
    .trim(),
  
  senha: z.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(255, 'Senha muito longa')
});
```

### Passo 2: Criar Middleware de Validação

**Criar arquivo:** `src/middlewares/validate.middleware.js`

```javascript
/**
 * Middleware genérico para validar requisições com Zod
 * @param {ZodSchema} schema - Schema Zod para validação
 * @param {string} source - Onde buscar dados: 'body', 'query', 'params'
 */
exports.validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      // ✅ Validar dados
      const validated = schema.parse(req[source]);
      
      // ✅ Substituir dados originais pelos validados (já sanitizados)
      req[source] = validated;
      
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        // ✅ Formatar erros de validação
        const errors = err.errors.map(e => ({
          campo: e.path.join('.'),
          mensagem: e.message
        }));
        
        return res.status(400).json({ 
          erro: 'Dados inválidos', 
          detalhes: errors 
        });
      }
      
      // Erro inesperado
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao validar dados' });
    }
  };
};
```

### Passo 3: Aplicar Validação nas Rotas

**Arquivo:** [src/routes/posts.routes.js](../src/routes/posts.routes.js)

```javascript
const express = require('express');
const router = express.Router();
const PostsController = require('../controllers/posts.controller');
const upload = require('../config/multer.config');
const { verificarToken, verificarProprietario } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { 
  createPostSchema, 
  updatePostSchema, 
  searchPostSchema 
} = require('../validators/post.validator');
const db = require('../models');

// Rotas públicas
router.get('/', PostsController.getAll);

// ✅ Validar query string
router.get('/search', 
  validate(searchPostSchema, 'query'),  // ✅ Valida req.query
  PostsController.search
);

router.get('/:id', PostsController.getById);

// Rotas protegidas
router.post('/', 
  verificarToken,
  upload.single('imagem'),
  validate(createPostSchema),  // ✅ Valida req.body
  PostsController.create
);

router.put('/:id', 
  verificarToken,
  verificarProprietario(db.Post),
  upload.single('imagem'),
  validate(updatePostSchema),  // ✅ Valida req.body
  PostsController.update
);

router.delete('/:id', 
  verificarToken,
  verificarProprietario(db.Post),
  PostsController.remove
);

module.exports = router;
```

**Arquivo:** [src/routes/auth.routes.js](../src/routes/auth.routes.js)

```javascript
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const StatsController = require('../controllers/stats.controller');
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { loginSchema } = require('../validators/auth.validator');

// ✅ Validar dados de login
router.post('/login', 
  validate(loginSchema),  // ✅ Valida req.body
  AuthController.login
);

router.get('/stats', 
  verificarToken,
  verificarAdmin,
  StatsController.getUserStats
);

module.exports = router;
```

### Passo 4: Atualizar Controllers (Simplificados)

**Arquivo:** [src/controllers/posts.controller.js](../src/controllers/posts.controller.js)

```javascript
exports.create = async (req, res) => {
  try {
    // ✅ Dados já validados pelo middleware
    const { titulo, conteudo, materia } = req.body;
    const usuario_id = req.usuario.id;
    const imagem = req.file ? req.file.filename : null;

    const novoPost = await Post.create({ 
      titulo, 
      conteudo, 
      usuario_id, 
      imagem, 
      materia 
    });
    
    res.status(201).json(novoPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar o post.' });
  }
};

exports.search = async (req, res) => {
  try {
    // ✅ Termo já validado pelo middleware
    const termo = req.query.q;
    
    const posts = await Post.findAll({
      where: {
        [Op.or]: [
          { titulo: { [Op.like]: `%${termo}%` } },
          { conteudo: { [Op.like]: `%${termo}%` } },
          { materia: { [Op.like]: `%${termo}%` } }
        ]
      },
      include: { model: Usuario, attributes: ['id', 'nome'] }
    });
    
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar posts' });
  }
};
```

**Arquivo:** [src/controllers/auth.controller.js](../src/controllers/auth.controller.js)

```javascript
exports.login = async (req, res) => {
  try {
    // ✅ Dados já validados e sanitizados pelo middleware
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    if (senha !== usuario.senha) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, admin: usuario.admin },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      admin: usuario.admin,
      token
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
};
```

### Passo 5: Adicionar Sanitização Extra (XSS)

Para prevenir XSS, instale biblioteca de sanitização:

```bash
npm install xss
```

**Criar middleware:** `src/middlewares/sanitize.middleware.js`

```javascript
const xss = require('xss');

/**
 * Middleware para sanitizar strings e prevenir XSS
 */
exports.sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value);  // ✅ Remove tags HTML maliciosas
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);  // Recursivo
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};
```

Aplicar globalmente no [src/app.js](../src/app.js):

```javascript
const { sanitizeBody } = require('./middlewares/sanitize.middleware');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);  // ✅ Sanitiza todos os requests
```

## ✅ Solução Implementada

Após a implementação:

- ✅ **Validação centralizada** com Zod
- ✅ **Mensagens de erro claras** e específicas
- ✅ **Sanitização automática** de strings (trim)
- ✅ **Prevenção XSS** com biblioteca xss
- ✅ **Código limpo** (controllers sem validação manual)

## 🔐 Boas Práticas Adicionais

### 1. Validação de ID nos Params

```javascript
const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser numérico').transform(Number)
});

router.get('/:id', 
  validate(idParamSchema, 'params'),
  PostsController.getById
);
```

### 2. Limitação de Taxa de Requisições

```javascript
const rateLimit = require('express-rate-limit');

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // 20 buscas por minuto
  message: 'Muitas buscas. Aguarde um momento.'
});

router.get('/search', searchLimiter, validate(searchPostSchema, 'query'), PostsController.search);
```

### 3. Validação de Tipos de Dados no Modelo

```javascript
const Post = sequelize.define('Post', {
  titulo: {
    type: DataTypes.STRING(60),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Título não pode ser vazio' },
      len: { args: [3, 60], msg: 'Título deve ter entre 3 e 60 caracteres' }
    }
  },
  conteudo: {
    type: DataTypes.STRING(1000),
    validate: {
      len: { args: [0, 1000], msg: 'Conteúdo muito longo' }
    }
  }
});
```

### 4. Helmet para Segurança de Headers

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());  // ✅ Adiciona headers de segurança
```

## 📚 Referências

- [Zod Documentation](https://zod.dev/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Sequelize Validators](https://sequelize.org/docs/v6/core-concepts/validations-and-constraints/)
