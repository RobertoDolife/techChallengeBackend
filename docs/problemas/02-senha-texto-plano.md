# Problema 02: Senhas Armazenadas em Texto Plano

## 🔍 Descrição do Problema

No arquivo `src/controllers/auth.controller.js`, as senhas estão sendo comparadas diretamente como **texto plano**, sem nenhuma criptografia.

**Localização:** [src/controllers/auth.controller.js](../src/controllers/auth.controller.js#L18-L20)

```javascript
if (senha !== usuario.senha) {  // ❌ Comparação de texto plano
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
}
```

## ⚠️ Por Que É Um Problema?

1. **VULNERABILIDADE CRÍTICA DE SEGURANÇA**: Se o banco de dados for comprometido, todas as senhas dos usuários ficam expostas.

2. **Violação da LGPD**: Armazenar senhas sem criptografia é violação da Lei Geral de Proteção de Dados.

3. **Risco de Reutilização**: Usuários costumam reutilizar senhas. Se vazadas, outros serviços ficam em risco.

4. **Sem Conformidade**: Não atende padrões de segurança como OWASP Top 10.

## 🛠️ Como Resolver

### Passo 1: Instalar Biblioteca bcrypt

```bash
npm install bcrypt
```

### Passo 2: Atualizar Modelo de Usuário

Adicione hook para criptografar senha antes de salvar:

**Arquivo:** [src/models/usuario.model.js](../src/models/usuario.model.js)

```javascript
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    senha: { type: DataTypes.STRING(255), allowNull: false },
    admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    tableName: 'usuario',
    timestamps: true,
    createdAt: 'data_criacao',
    updatedAt: 'data_atualizacao',
    hooks: {
      beforeCreate: async (usuario) => {
        if (usuario.senha) {
          usuario.senha = await bcrypt.hash(usuario.senha, 10);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed('senha')) {
          usuario.senha = await bcrypt.hash(usuario.senha, 10);
        }
      }
    }
  });

  // Método para comparar senhas
  Usuario.prototype.validarSenha = async function(senha) {
    return await bcrypt.compare(senha, this.senha);
  };

  return Usuario;
};
```

### Passo 3: Atualizar Controller de Autenticação

**Arquivo:** [src/controllers/auth.controller.js](../src/controllers/auth.controller.js)

```javascript
const db = require('../models');
const Usuario = db.Usuario;
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Validar campos obrigatórios
    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    // 2. Buscar usuário pelo email
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    // 3. Validar senha usando bcrypt
    const senhaValida = await usuario.validarSenha(senha);
    
    if (!senhaValida) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    // 4. Gerar token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, admin: usuario.admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5. Retornar resposta (SEM a senha)
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

### Passo 4: Criar Migration para Atualizar Senhas Existentes

Se já existem usuários no banco, crie uma migration:

```bash
npm run migration:create atualizar-senhas-criptografadas
```

**Conteúdo da migration:**

```javascript
'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const usuarios = await queryInterface.sequelize.query(
      'SELECT id, senha FROM usuario',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const usuario of usuarios) {
      // Verifica se a senha já está hasheada
      if (!usuario.senha.startsWith('$2b$')) {
        const senhaHash = await bcrypt.hash(usuario.senha, 10);
        await queryInterface.sequelize.query(
          'UPDATE usuario SET senha = ? WHERE id = ?',
          { replacements: [senhaHash, usuario.id] }
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Não há como reverter (não sabemos as senhas originais)
    console.log('⚠️  Reversão não disponível - senhas criptografadas não podem ser descriptografadas');
  }
};
```

Execute a migration:

```bash
npm run db:migrate
```

## ✅ Solução Implementada

Após a implementação:

- ✅ **Senhas criptografadas** com bcrypt (algoritmo seguro)
- ✅ **Salt automático** de 10 rounds (padrão da indústria)
- ✅ **Validação segura** sem expor informações
- ✅ **Hook automático** criptografa em criação e atualização
- ✅ **Conformidade LGPD** e OWASP

## 🔐 Boas Práticas Adicionais

### 1. Política de Senha Forte

Adicione validação no modelo:

```javascript
const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if (!senhaForte.test(usuario.senha)) {
  throw new Error('Senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo');
}
```

### 2. Rate Limiting no Login

Adicione middleware para prevenir força bruta:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

router.post('/login', loginLimiter, AuthController.login);
```

### 3. Nunca Retornar Senhas

Sempre exclua a senha das respostas:

```javascript
const usuario = await Usuario.findOne({
  where: { email },
  attributes: { exclude: ['senha'] } // ✅ Exclui senha
});
```

## 📚 Referências

- [bcrypt.js Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
