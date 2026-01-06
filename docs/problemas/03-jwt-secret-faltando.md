# Problema 03: JWT_SECRET Não Configurado

## 🔍 Descrição do Problema

O arquivo `src/common/env.js` **não valida** a presença da variável `JWT_SECRET`, mas ela é usada em [src/controllers/auth.controller.js](../src/controllers/auth.controller.js#L26).

**Localização:** [src/common/env.js](../src/common/env.js#L3-L11)

```javascript
exports.env = z
  .object({
    PORT: z.coerce.number().default(3000),
    DATABASE_HOST: z.string().nonempty(),
    DATABASE_PORT: z.coerce.number().default(3306),
    DATABASE_USERNAME: z.string().nonempty(),
    DATABASE_PASSWORD: z.string().nonempty()
    // ❌ JWT_SECRET não está aqui!
  })
  .parse(process.env)
```

**Uso no código:**

```javascript
const token = jwt.sign(
  { id: usuario.id, email: usuario.email, admin: usuario.admin },
  process.env.JWT_SECRET,  // ❌ Pode ser undefined!
  { expiresIn: "1h" }
);
```

## ⚠️ Por Que É Um Problema?

1. **Token Inválido**: Se `JWT_SECRET` estiver undefined, o JWT é assinado com `"undefined"` como string, gerando tokens inválidos.

2. **Falha Silenciosa**: O servidor inicia normalmente, mas o login não funciona corretamente.

3. **Vulnerabilidade de Segurança**: Um JWT_SECRET previsível ou ausente permite falsificação de tokens.

4. **Erro em Produção**: Se a variável não estiver configurada em produção, a aplicação quebra.

## 🛠️ Como Resolver

### Passo 1: Adicionar JWT_SECRET no Validador

**Arquivo:** [src/common/env.js](../src/common/env.js)

```javascript
const { z } = require('zod/v4')

exports.env = z
  .object({
    PORT: z.coerce.number().default(3000),

    DATABASE_HOST: z.string().nonempty(),
    DATABASE_PORT: z.coerce.number().default(3306),
    DATABASE_USERNAME: z.string().nonempty(),
    DATABASE_PASSWORD: z.string().nonempty(),
    
    // ✅ Adicionar validação do JWT_SECRET
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres')
  })
  .parse(process.env)
```

### Passo 2: Adicionar JWT_SECRET no .env.example

**Arquivo:** [.env.example](../.env.example)

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=senha123
DB_NAME=SchoolOnDb
DB_PORT=3306
PORT=3000

# ✅ Adicionar JWT_SECRET
JWT_SECRET=sua-chave-super-secreta-de-no-minimo-32-caracteres-aqui
```

### Passo 3: Gerar JWT_SECRET Seguro

No terminal, gere uma chave aleatória forte:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Isso gera algo como:

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4
```

### Passo 4: Adicionar no Arquivo .env

Adicione no seu arquivo `.env` (não commitado):

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4
```

### Passo 5: Usar env.JWT_SECRET no Controller

**Arquivo:** [src/controllers/auth.controller.js](../src/controllers/auth.controller.js)

```javascript
const db = require('../models');
const Usuario = db.Usuario;
const jwt = require("jsonwebtoken");
const { env } = require('../common/env'); // ✅ Importar env

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    if (senha !== usuario.senha) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    // ✅ Usar env.JWT_SECRET validado
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, admin: usuario.admin },
      env.JWT_SECRET,  // ✅ Validado pelo Zod
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

## ✅ Solução Implementada

Após a implementação:

- ✅ **JWT_SECRET validado** na inicialização da aplicação
- ✅ **Falha rápida**: Se não configurado, app não inicia
- ✅ **Chave forte**: Mínimo 32 caracteres
- ✅ **Segurança**: Chave não fica hardcoded no código

## 🔐 Boas Práticas Adicionais

### 1. Diferentes Secrets para Diferentes Ambientes

```env
# Desenvolvimento
JWT_SECRET=dev-secret-key-32-chars-minimum-here

# Produção (mais seguro)
JWT_SECRET=prod-super-secure-random-key-64-chars-or-more
```

### 2. Rotação de Chaves

Para permitir rotação sem quebrar tokens antigos:

```javascript
JWT_SECRET=chave-atual
JWT_SECRET_OLD=chave-anterior  // Aceitar por 24h
```

### 3. Validar Token em Middleware

Crie um middleware de autenticação:

**Arquivo:** `src/middlewares/auth.middleware.js`

```javascript
const jwt = require('jsonwebtoken');
const { env } = require('../common/env');

exports.verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
```

Use nas rotas protegidas:

```javascript
const { verificarToken } = require('../middlewares/auth.middleware');

router.post('/', verificarToken, upload.single('imagem'), PostsController.create);
router.put('/:id', verificarToken, upload.single('imagem'), PostsController.update);
router.delete('/:id', verificarToken, PostsController.remove);
```

### 4. Configurar Tempo de Expiração via ENV

```javascript
JWT_SECRET=sua-chave
JWT_EXPIRES_IN=1h  // ou 15m, 7d, etc
```

```javascript
const token = jwt.sign(
  { id: usuario.id, email: usuario.email, admin: usuario.admin },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN || '1h' }
);
```

## 📚 Referências

- [JSON Web Tokens (JWT)](https://jwt.io/)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
