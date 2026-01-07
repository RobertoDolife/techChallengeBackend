const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Tipos MIME permitidos
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Extensões permitidas
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Tamanho máximo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Gera nome aleatório seguro
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${randomName}${extension}`;
    cb(null, uniqueName);
  }
});

// Validação de arquivo
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
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

module.exports = upload;
