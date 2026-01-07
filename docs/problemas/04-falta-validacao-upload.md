# Problema 04: Falta de Validação no Upload de Arquivos

## 🔍 Descrição do Problema

O arquivo `src/config/multer.config.js` **não valida** o tipo, tamanho ou nome dos arquivos enviados, permitindo upload de qualquer tipo de arquivo.

**Localização:** [src/config/multer.config.js](../src/config/multer.config.js)

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'public', 'uploads', 'posts'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;  // ❌ Aceita qualquer nome
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });  // ❌ Sem validações
```

## ⚠️ Por Que É Um Problema?

1. **VULNERABILIDADE CRÍTICA**: Usuários podem fazer upload de scripts maliciosos (.php, .exe, .js).

2. **Ataque de Negação de Serviço (DoS)**: Sem limite de tamanho, usuários podem enviar arquivos gigantes e esgotar o disco.

3. **Execução Remota de Código**: Arquivos .php, .jsp ou .asp podem ser executados se o servidor estiver mal configurado.

4. **Path Traversal**: Nomes com `../../../etc/passwd` podem sobrescrever arquivos do sistema.

5. **Consumo de Recursos**: Imagens muito grandes podem travar o servidor.

## 🛠️ Como Resolver

### Passo 1: Instalar Biblioteca de Validação

```bash
npm install file-type mime-types
```

### Passo 2: Criar Configuração Segura do Multer

**Arquivo:** [src/config/multer.config.js](../src/config/multer.config.js)

```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// ✅ Tipos MIME permitidos
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// ✅ Extensões permitidas
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// ✅ Tamanho máximo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // ✅ Gera nome aleatório seguro
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${randomName}${extension}`;
    cb(null, uniqueName);
  }
});

// ✅ Validação de arquivo
const fileFilter = (req, file, cb) => {
  // Validar extensão
  const extension = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return cb(new Error(`Extensão não permitida. Use: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }

  // Validar MIME type
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error(`Tipo de arquivo não permitido. Use: ${ALLOWED_MIMES.join(', ')}`), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,  // ✅ Limite de 5MB
    files: 1  // ✅ Apenas 1 arquivo por vez
  }
});

module.exports = upload;
```

### Passo 3: Tratar Erros no Controller

**Arquivo:** [src/controllers/posts.controller.js](../src/controllers/posts.controller.js)

```javascript
exports.create = async (req, res) => {
  try {
    const { titulo, conteudo, usuario_id, materia } = req.body;
    
    // ✅ Validar campos obrigatórios
    if (!titulo || !usuario_id) {
      return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
    }

    const imagem = req.file ? req.file.filename : null;
    const novoPost = await Post.create({ titulo, conteudo, usuario_id, imagem, materia });
    
    res.status(201).json(novoPost);
  } catch (error) {
    // ✅ Limpar arquivo se erro ocorrer
    if (req.file) {
      const fs = require('fs');
      const filePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Erro ao deletar arquivo:', err);
      });
    }
    
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar o post.' });
  }
};
```

### Passo 4: Adicionar Middleware de Erro nas Rotas

**Arquivo:** [src/routes/posts.routes.js](../src/routes/posts.routes.js)

```javascript
const express = require('express');
const router = express.Router();
const PostsController = require('../controllers/posts.controller');
const upload = require('../config/multer.config');

// ✅ Middleware para tratar erros do multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ erro: 'Arquivo muito grande. Máximo: 5MB' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ erro: 'Número de arquivos excedido' });
    }
    return res.status(400).json({ erro: `Erro no upload: ${err.message}` });
  }
  
  if (err) {
    return res.status(400).json({ erro: err.message });
  }
  
  next();
};

router.get('/', PostsController.getAll);
router.get('/search', PostsController.search);
router.get('/:id', PostsController.getById);

// ✅ Adicionar middleware de erro
router.post('/', upload.single('imagem'), handleMulterError, PostsController.create);
router.put('/:id', upload.single('imagem'), handleMulterError, PostsController.update);

router.delete('/:id', PostsController.remove);

module.exports = router;
```

### Passo 5: Criar Pasta de Upload com Permissões Corretas

No terminal:

```bash
mkdir -p public/uploads/posts
# No Linux/Mac, configure permissões
chmod 755 public/uploads/posts
```

### Passo 6: Adicionar Validação de Tipo Real (Magic Number)

Para segurança extra, valide o "magic number" do arquivo:

```bash
npm install file-type
```

**Criar middleware:** `src/middlewares/validateFileType.middleware.js`

```javascript
const { fileTypeFromBuffer } = require('file-type');
const fs = require('fs').promises;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

exports.validateFileType = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const buffer = await fs.readFile(req.file.path);
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
      // ✅ Remove arquivo inválido
      await fs.unlink(req.file.path);
      return res.status(400).json({ erro: 'Tipo de arquivo inválido' });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao validar arquivo' });
  }
};
```

Use nas rotas:

```javascript
const { validateFileType } = require('../middlewares/validateFileType.middleware');

router.post('/', 
  upload.single('imagem'), 
  handleMulterError,
  validateFileType,  // ✅ Validação extra
  PostsController.create
);
```

## ✅ Solução Implementada

Após a implementação:

- ✅ **Apenas imagens permitidas** (JPG, PNG, GIF, WEBP)
- ✅ **Limite de 5MB** por arquivo
- ✅ **Nomes seguros** (gerados com crypto)
- ✅ **Validação de MIME type**
- ✅ **Validação de Magic Number** (opcional, mas recomendado)
- ✅ **Tratamento de erros** adequado

## 🔐 Boas Práticas Adicionais

### 1. Armazenar Fora da Raiz Web

```javascript
// ✅ Melhor: fora de public/
const uploadPath = path.join(__dirname, '..', '..', 'storage', 'uploads', 'posts');
```

### 2. Usar Serviço de Armazenamento na Nuvem

Para produção, use AWS S3, Cloudinary ou Azure Blob:

```bash
npm install multer-s3 @aws-sdk/client-s3
```

### 3. Comprimir Imagens

```bash
npm install sharp
```

```javascript
const sharp = require('sharp');

const compressImage = async (filePath) => {
  const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '-compressed.$1');
  await sharp(filePath)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
  
  await fs.unlink(filePath);  // Remove original
  return outputPath;
};
```

### 4. Escanear Vírus

Use ClamAV ou VirusTotal API para escanear uploads.

## 📚 Referências

- [Multer Documentation](https://github.com/expressjs/multer)
- [OWASP File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [File Type Package](https://github.com/sindresorhus/file-type)
