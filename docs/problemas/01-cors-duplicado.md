# Problema 01: Configuração CORS Duplicada

## 🔍 Descrição do Problema

No arquivo `src/app.js`, o middleware CORS está sendo configurado **duas vezes**, causando conflito e comportamento imprevisível.

**Localização:** [src/app.js](../src/app.js#L9-L15)

```javascript
app.use(cors());  // ❌ CORS sem restrições (linha 9)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({  // ❌ CORS restrito (linhas 13-16)
  origin: "http://localhost:8080",
  credentials: true
}));
```

## ⚠️ Por Que É Um Problema?

1. **Conflito de Configurações**: A primeira chamada `app.use(cors())` permite **todas as origens** (`Access-Control-Allow-Origin: *`), enquanto a segunda restringe apenas para `http://localhost:8080`.

2. **Comportamento Imprevisível**: Dependendo da ordem de execução, o navegador pode receber headers CORS conflitantes.

3. **Falha de Segurança em Produção**: Se o CORS está aberto para todas as origens, qualquer site malicioso pode fazer requisições à sua API.

4. **Credenciais Não Funcionam**: Quando `credentials: true`, não é possível usar `origin: "*"`. Isso gera erro no navegador.

## 🛠️ Como Resolver

### Passo 1: Remover CORS Duplicado

Abra o arquivo [src/app.js](../src/app.js) e remova a **primeira** configuração:

```javascript
// ❌ REMOVER ESTA LINHA
app.use(cors());
```

### Passo 2: Configurar CORS Corretamente

Mantenha apenas **uma** configuração de CORS, mas com suporte a múltiplas origens:

```javascript
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      'https://seudominio.com.br'
    ];
    
    // Permite requisições sem origin (ex: Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Passo 3: Criar Variável de Ambiente

Adicione no arquivo `.env`:

```env
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000,https://seudominio.com.br
```

### Passo 4: Usar Variável de Ambiente no CORS

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:8080'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## ✅ Solução Implementada

A configuração correta garante:

- ✅ **Apenas origens autorizadas** podem acessar a API
- ✅ **Suporte a credenciais** (cookies, JWT via headers)
- ✅ **Fácil gerenciamento** via variáveis de ambiente
- ✅ **Sem conflitos** de middleware

## 🔒 Segurança em Produção

Em produção, **nunca** use `origin: "*"` com `credentials: true`. Configure apenas as origens do seu frontend real:

```javascript
// ✅ Produção
origin: ['https://app.seudominio.com.br']

// ❌ NÃO FAZER
origin: "*"
```

## 📚 Referências

- [MDN - CORS](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS)
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)
