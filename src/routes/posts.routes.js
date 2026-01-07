const express = require('express');
const router = express.Router();
const PostsController = require('../controllers/posts.controller');
const upload = require('../config/multer.config');
const { verificarToken, verificarProprietario } = require('../middlewares/auth.middleware');
const db = require('../models');
const multer = require('multer');

// Rotas públicas (sem autenticação)
router.get('/', PostsController.getAll);
router.get('/search', PostsController.search);
router.get('/:id', PostsController.getById);

// Rotas protegidas (requerem autenticação)
router.post('/', 
  verificarToken,
  upload.single('imagem'), 
  PostsController.create
);

router.put('/:id', 
  verificarToken,
  verificarProprietario(db.Post),
  upload.single('imagem'), 
  PostsController.update
);

router.delete('/:id', 
  verificarToken,
  verificarProprietario(db.Post),
  PostsController.remove
);

// Middleware para tratar erros do multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ erro: 'Arquivo muito grande. Máximo: 5MB' });
    }
    return res.status(400).json({ erro: err.message });
  }
  
  if (err) {
    return res.status(400).json({ erro: err.message });
  }
  
  next();
});

module.exports = router;
