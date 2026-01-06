# Problema 05: Falta de Autenticação nas Rotas Protegidas

## 🔍 Descrição do Problema

As rotas de criação, edição e exclusão de posts **não possuem autenticação**, permitindo que qualquer pessoa (mesmo sem login) possa criar, editar ou deletar posts.

**Localização:** [src/routes/posts.routes.js](../src/routes/posts.routes.js)

```javascript
router.post('/', upload.single('imagem'), PostsController.create);  // ❌ Sem autenticação
router.put('/:id', upload.single('imagem'), PostsController.update);  // ❌ Sem autenticação
router.delete('/:id', PostsController.remove);  // ❌ Sem autenticação
```

## ⚠️ Por Que É Um Problema?

1. **VULNERABILIDADE CRÍTICA**: Qualquer pessoa pode criar, editar ou deletar posts sem estar autenticada.

2. **Falta de Controle de Acesso**: Não há verificação de quem é o dono do post.

3. **Violação de Privacidade**: Um usuário pode editar posts de outros usuários.

4. **Spam e Abuso**: Sem autenticação, bots podem criar posts em massa.

5. **Sem Auditoria**: Não é possível rastrear quem fez alterações.

## 🛠️ Como Resolver

### Passo 1: Criar Middleware de Autenticação

**Criar arquivo:** `src/middlewares/auth.middleware.js`

```javascript
const jwt = require('jsonwebtoken');
const { env } = require('../common/env');

/**
 * Middleware que verifica se o usuário está autenticado
 */
exports.verificarToken = (req, res, next) => {
  try {
    // ✅ Buscar token no header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // ✅ Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    const token = parts[1];

    // ✅ Verificar e decodificar token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // ✅ Adicionar dados do usuário na requisição
    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      admin: decoded.admin
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.status(401).json({ error: 'Falha na autenticação' });
  }
};

/**
 * Middleware que verifica se o usuário é admin
 */
exports.verificarAdmin = (req, res, next) => {
  if (!req.usuario || !req.usuario.admin) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

/**
 * Middleware que verifica se o usuário é dono do recurso ou admin
 */
exports.verificarProprietario = (model) => {
  return async (req, res, next) => {
    try {
      const recursoId = req.params.id;
      const recurso = await model.findByPk(recursoId);

      if (!recurso) {
        return res.status(404).json({ error: 'Recurso não encontrado' });
      }

      // ✅ Admin pode tudo
      if (req.usuario.admin) {
        return next();
      }

      // ✅ Verifica se é o dono
      if (recurso.usuario_id !== req.usuario.id) {
        return res.status(403).json({ error: 'Você não tem permissão para modificar este recurso' });
      }

      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
  };
};
```

### Passo 2: Aplicar Middleware nas Rotas

**Arquivo:** [src/routes/posts.routes.js](../src/routes/posts.routes.js)

```javascript
const express = require('express');
const router = express.Router();
const PostsController = require('../controllers/posts.controller');
const upload = require('../config/multer.config');
const { verificarToken, verificarProprietario } = require('../middlewares/auth.middleware');
const db = require('../models');

// ✅ Rotas públicas (sem autenticação)
router.get('/', PostsController.getAll);
router.get('/search', PostsController.search);
router.get('/:id', PostsController.getById);

// ✅ Rotas protegidas (requerem autenticação)
router.post('/', 
  verificarToken,  // ✅ Verifica se está autenticado
  upload.single('imagem'), 
  PostsController.create
);

router.put('/:id', 
  verificarToken,  // ✅ Verifica se está autenticado
  verificarProprietario(db.Post),  // ✅ Verifica se é dono ou admin
  upload.single('imagem'), 
  PostsController.update
);

router.delete('/:id', 
  verificarToken,  // ✅ Verifica se está autenticado
  verificarProprietario(db.Post),  // ✅ Verifica se é dono ou admin
  PostsController.remove
);

module.exports = router;
```

### Passo 3: Atualizar Controller para Usar Usuário Autenticado

**Arquivo:** [src/controllers/posts.controller.js](../src/controllers/posts.controller.js)

```javascript
exports.create = async (req, res) => {
  try {
    const { titulo, conteudo, materia } = req.body;
    
    // ✅ Usar ID do usuário autenticado
    const usuario_id = req.usuario.id;

    if (!titulo) {
      return res.status(400).json({ erro: 'Título é obrigatório' });
    }

    const imagem = req.file ? req.file.filename : null;
    const novoPost = await Post.create({ 
      titulo, 
      conteudo, 
      usuario_id,  // ✅ Do token, não do body
      imagem, 
      materia 
    });
    
    res.status(201).json(novoPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar o post.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { titulo, conteudo, materia } = req.body;

    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ erro: 'Post não encontrado' });

    // ✅ Verificação já feita pelo middleware verificarProprietario
    // Aqui apenas atualiza

    if (req.file && post.imagem) {
      const oldImagePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts', post.imagem);
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error('Erro ao deletar imagem antiga:', err);
      });
    }

    const imagem = req.file ? req.file.filename : post.imagem;
    const updatedPost = await post.update({ titulo, conteudo, imagem, materia });

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar post' });
  }
};

exports.remove = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ erro: 'Post não encontrado' });

    // ✅ Verificação já feita pelo middleware verificarProprietario
    
    // ✅ Remove imagem se existir
    if (post.imagem) {
      const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts', post.imagem);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Erro ao deletar imagem:', err);
      });
    }

    await post.destroy();
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao deletar post' });
  }
};
```

### Passo 4: Proteger Rota de Estatísticas

**Arquivo:** [src/routes/auth.routes.js](../src/routes/auth.routes.js)

```javascript
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const StatsController = require('../controllers/stats.controller');
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');

// ✅ Rota pública
router.post('/login', AuthController.login);

// ✅ Rota protegida - apenas admins
router.get('/stats', 
  verificarToken,  // ✅ Verifica autenticação
  verificarAdmin,  // ✅ Verifica se é admin
  StatsController.getUserStats
);

module.exports = router;
```

### Passo 5: Testar Autenticação

**Requisição com autenticação:**

```bash
# 1. Fazer login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com","senha":"123456"}'

# Resposta:
# {
#   "id": 1,
#   "nome": "João Silva",
#   "email": "usuario@email.com",
#   "admin": false,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }

# 2. Criar post com token
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Meu Post","conteudo":"Conteúdo legal"}'

# 3. Tentar criar sem token (deve falhar)
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Post sem auth","conteudo":"Vai falhar"}'

# Resposta: 401 Unauthorized
# { "error": "Token não fornecido" }
```

## ✅ Solução Implementada

Após a implementação:

- ✅ **Autenticação obrigatória** para criar, editar e deletar
- ✅ **Verificação de proprietário** (apenas dono ou admin pode editar/deletar)
- ✅ **Rotas públicas** mantidas (listar, buscar, ver detalhes)
- ✅ **Mensagens de erro claras**
- ✅ **Reutilizável** (middleware pode ser usado em outras rotas)

## 🔐 Boas Práticas Adicionais

### 1. Refresh Tokens

Implementar tokens de curta duração + refresh tokens:

```javascript
// Token principal: 15 minutos
expiresIn: '15m'

// Refresh token: 7 dias
refreshExpiresIn: '7d'
```

### 2. Blacklist de Tokens (Logout)

```javascript
const blacklist = new Set();

exports.logout = (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  blacklist.add(token);
  res.json({ message: 'Logout realizado' });
};
```

### 3. Rate Limiting por Usuário

```javascript
const rateLimit = require('express-rate-limit');

const createPostLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 posts por minuto
  keyGenerator: (req) => req.usuario.id
});

router.post('/', verificarToken, createPostLimiter, PostsController.create);
```

## 📚 Referências

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
