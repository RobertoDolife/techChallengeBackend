# Problema 07: Variáveis de Ambiente com Nomes Inconsistentes

## 🔍 Descrição do Problema

O arquivo `.env.example` usa nomes diferentes das variáveis validadas em `src/common/env.js`, causando confusão na configuração.

**Arquivo `.env.example`:**
```env
DB_HOST=localhost      # ❌ Nome: DB_HOST
DB_USER=root           # ❌ Nome: DB_USER
DB_PASS=senha123       # ❌ Nome: DB_PASS
DB_NAME=SchoolOnDb     # ❌ Nome: DB_NAME (não validado!)
DB_PORT=3306           # ❌ Nome: DB_PORT
```

**Arquivo `src/common/env.js`:**
```javascript
exports.env = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_HOST: z.string().nonempty(),      // ✅ Nome: DATABASE_HOST
  DATABASE_PORT: z.coerce.number().default(3306),
  DATABASE_USERNAME: z.string().nonempty(),  // ✅ Nome: DATABASE_USERNAME
  DATABASE_PASSWORD: z.string().nonempty()   // ✅ Nome: DATABASE_PASSWORD
  // ❌ DB_NAME não está validado!
})
```

## ⚠️ Por Que É Um Problema?

1. **Aplicação Não Inicia**: Desenvolvedores copiam `.env.example`, mas variáveis têm nomes diferentes.

2. **Erros Confusos**: Zod lança erro "DATABASE_HOST is required", mas desenvolvedor configurou "DB_HOST".

3. **DB_NAME Não Validado**: Nome do banco não é validado, causando erro em runtime.

4. **Dificuldade de Manutenção**: Dois locais com informações conflitantes.

5. **Experiência Ruim**: Novos desenvolvedores perdem tempo debugando configuração.

## 🛠️ Como Resolver

### Passo 1: Atualizar Validador de Ambiente

**Arquivo:** [src/common/env.js](../src/common/env.js)

```javascript
const { z } = require('zod');

exports.env = z
  .object({
    // ✅ Servidor
    PORT: z.coerce.number().default(3000),
    
    // ✅ Banco de Dados
    DATABASE_HOST: z.string().nonempty('DATABASE_HOST é obrigatório'),
    DATABASE_PORT: z.coerce.number().default(3306),
    DATABASE_USERNAME: z.string().nonempty('DATABASE_USERNAME é obrigatório'),
    DATABASE_PASSWORD: z.string().nonempty('DATABASE_PASSWORD é obrigatório'),
    DATABASE_NAME: z.string().nonempty('DATABASE_NAME é obrigatório'),  // ✅ Adicionado
    
    // ✅ JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('1h'),
    
    // ✅ Ambiente
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    
    // ✅ CORS (opcional)
    ALLOWED_ORIGINS: z.string().optional()
  })
  .parse(process.env);
```

### Passo 2: Atualizar .env.example

**Arquivo:** [.env.example](../.env.example)

```env
# ====================
# SERVIDOR
# ====================
PORT=3000
NODE_ENV=development

# ====================
# BANCO DE DADOS
# ====================
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=senha123
DATABASE_NAME=SchoolOnDb

# ====================
# AUTENTICAÇÃO JWT
# ====================
# Gere uma chave forte: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=sua-chave-super-secreta-de-no-minimo-32-caracteres-aqui
JWT_EXPIRES_IN=1h

# ====================
# CORS (Origens Permitidas)
# ====================
# Separe múltiplas origens por vírgula
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
```

### Passo 3: Atualizar Conexão do Sequelize

**Arquivo:** [src/database/sequelize.js](../src/database/sequelize.js)

```javascript
const { Sequelize } = require('sequelize');
const { env } = require('../common/env');

// ✅ Usar DATABASE_NAME validado
const connectionString = `mysql://${env.DATABASE_USERNAME}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`;

exports.sequelize = new Sequelize(connectionString, {
  dialect: 'mysql',
  logging: env.NODE_ENV === 'development' ? console.log : false,  // ✅ Log apenas em dev
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
```

### Passo 4: Criar Script de Validação

**Criar arquivo:** `scripts/validate-env.js`

```javascript
#!/usr/bin/env node
const { z } = require('zod');
const fs = require('fs');
const path = require('path');

// Carregar .env se existir
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_HOST: z.string().nonempty(),
  DATABASE_PORT: z.coerce.number().default(3306),
  DATABASE_USERNAME: z.string().nonempty(),
  DATABASE_PASSWORD: z.string().nonempty(),
  DATABASE_NAME: z.string().nonempty(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().optional()
});

try {
  envSchema.parse(process.env);
  console.log('✅ Variáveis de ambiente válidas!');
  process.exit(0);
} catch (err) {
  console.error('❌ Erro nas variáveis de ambiente:\n');
  if (err.name === 'ZodError') {
    err.errors.forEach(e => {
      console.error(`  - ${e.path.join('.')}: ${e.message}`);
    });
  }
  console.error('\n💡 Dica: Copie .env.example para .env e preencha os valores corretos.');
  process.exit(1);
}
```

### Passo 5: Adicionar Script no package.json

**Arquivo:** [package.json](../package.json)

```json
{
  "scripts": {
    "start": "node --env-file-if-exists .env server.js",
    "dev": "nodemon --env-file-if-exists .env server.js",
    "validate:env": "node scripts/validate-env.js",
    "db:migrate": "npm run validate:env && dotenv -e .env -- sequelize db:migrate --config ./src/database/config.js --migrations-path ./src/database/migrations",
    "migration:create": "sequelize migration:create --migrations-path ./src/database/migrations --name $1",
    "test": "jest --runInBand --coverage"
  }
}
```

### Passo 6: Atualizar README com Instruções

**Adicionar em [README.md](../README.md):**

```markdown
## 🔧 Configuração de Ambiente

### 1. Copiar arquivo de exemplo

```bash
cp .env.example .env
```

### 2. Preencher variáveis obrigatórias

Edite o arquivo `.env` e configure:

```env
DATABASE_HOST=localhost
DATABASE_USERNAME=root
DATABASE_PASSWORD=suasenha
DATABASE_NAME=SchoolOnDb

JWT_SECRET=sua-chave-super-secreta-32-chars-minimo
```

**Gerar JWT_SECRET forte:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Validar configuração

```bash
npm run validate:env
```

Se tudo estiver correto, você verá:

```
✅ Variáveis de ambiente válidas!
```

### 4. Iniciar aplicação

```bash
npm start
```

## 📋 Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `PORT` | Não | `3000` | Porta do servidor |
| `DATABASE_HOST` | Sim | - | Host do MySQL |
| `DATABASE_PORT` | Não | `3306` | Porta do MySQL |
| `DATABASE_USERNAME` | Sim | - | Usuário do banco |
| `DATABASE_PASSWORD` | Sim | - | Senha do banco |
| `DATABASE_NAME` | Sim | - | Nome do banco de dados |
| `JWT_SECRET` | Sim | - | Chave secreta JWT (mín. 32 chars) |
| `JWT_EXPIRES_IN` | Não | `1h` | Tempo de expiração do token |
| `NODE_ENV` | Não | `development` | Ambiente (development/production/test) |
| `ALLOWED_ORIGINS` | Não | - | Origens CORS (separadas por vírgula) |
```

## ✅ Solução Implementada

Após a implementação:

- ✅ **Nomes consistentes** entre `.env.example` e validação
- ✅ **DATABASE_NAME validado** (antes estava faltando)
- ✅ **Script de validação** detecta erros antes de iniciar
- ✅ **Documentação clara** no README
- ✅ **Valores padrão sensatos** quando aplicável

## 🔐 Boas Práticas Adicionais

### 1. Diferentes Arquivos por Ambiente

```bash
.env.development
.env.production
.env.test
```

```bash
npm start -- --env-file=.env.production
```

### 2. Validação no CI/CD

**.github/workflows/ci-cd.yml:**

```yaml
- name: Validate Environment
  run: npm run validate:env
  env:
    DATABASE_HOST: localhost
    DATABASE_USERNAME: root
    DATABASE_PASSWORD: test
    DATABASE_NAME: test_db
    JWT_SECRET: test-secret-key-32-characters-long
```

### 3. Variáveis Sensíveis no Git

Certifique-se que `.env` está no `.gitignore`:

```gitignore
# Variáveis de ambiente
.env
.env.local
.env.*.local

# Mantenha apenas o exemplo
!.env.example
```

### 4. Segredos em Produção

Use serviços de gestão de segredos:

- **AWS**: AWS Secrets Manager
- **Azure**: Azure Key Vault
- **GCP**: Secret Manager
- **Docker**: Docker Secrets
- **Kubernetes**: Kubernetes Secrets

## 📚 Referências

- [Zod Documentation](https://zod.dev/)
- [dotenv Best Practices](https://github.com/motdotla/dotenv#should-i-commit-my-env-file)
- [12 Factor App - Config](https://12factor.net/config)
