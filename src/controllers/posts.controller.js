const db = require('../models');
const Post = db.Post;
const Usuario = db.Usuario;
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middlewares/error.middleware');

// GET /posts - Listar todos os posts
exports.getAll = asyncHandler(async (req, res) => {
  const posts = await Post.findAll({
    order: [['data_criacao', 'DESC']],
    include: { model: Usuario, attributes: ['id', 'nome', 'email'] }
  });
  
  res.status(200).json({
    success: true,
    data: posts,
    count: posts.length
  });
});

// GET /posts/:id - Buscar post por ID
exports.getById = asyncHandler(async (req, res) => {
  const post = await Post.findByPk(req.params.id, {
    include: { model: Usuario, attributes: ['id', 'nome', 'email'] }
  });
  
  if (!post) {
    throw ApiError.notFound('Post não encontrado');
  }

  res.status(200).json({
    success: true,
    data: post
  });
});

// POST /posts - Criar novo post
exports.create = asyncHandler(async (req, res) => {
  const { titulo, conteudo, materia } = req.body;
  
  // Validar campos obrigatórios
  if (!titulo) {
    throw ApiError.badRequest('O título é obrigatório');
  }
  
  if (!conteudo) {
    throw ApiError.badRequest('O conteúdo é obrigatório');
  }

  // usuario_id vem do token (req.usuario.id)
  const usuario_id = req.usuario.id;
  
  const imagem = req.file ? req.file.filename : null;
  
  const novoPost = await Post.create({ 
    titulo, 
    conteudo, 
    usuario_id, 
    imagem, 
    materia 
  });
  
  // Buscar post com dados do usuário
  const postCompleto = await Post.findByPk(novoPost.id, {
    include: { model: Usuario, attributes: ['id', 'nome', 'email'] }
  });
  
  res.status(201).json({
    success: true,
    message: 'Post criado com sucesso',
    data: postCompleto
  });
});

// PUT /posts/:id - Atualizar post
exports.update = asyncHandler(async (req, res) => {
  const { titulo, conteudo, materia } = req.body;

  const post = await Post.findByPk(req.params.id);
  
  if (!post) {
    throw ApiError.notFound('Post não encontrado');
  }

  // Deletar imagem antiga se uma nova for enviada
  if (req.file && post.imagem) {
    const oldImagePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts', post.imagem);
    fs.unlink(oldImagePath, (err) => {
      if (err) console.error('Erro ao deletar imagem antiga:', err);
    });
  }

  const imagem = req.file ? req.file.filename : post.imagem;

  const updatedPost = await post.update({ 
    titulo: titulo || post.titulo, 
    conteudo: conteudo || post.conteudo, 
    imagem, 
    materia: materia || post.materia 
  });

  // Buscar post atualizado com dados do usuário
  const postCompleto = await Post.findByPk(updatedPost.id, {
    include: { model: Usuario, attributes: ['id', 'nome', 'email'] }
  });

  res.status(200).json({
    success: true,
    message: 'Post atualizado com sucesso',
    data: postCompleto
  });
});

// DELETE /posts/:id - Deletar post
exports.remove = asyncHandler(async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  
  if (!post) {
    throw ApiError.notFound('Post não encontrado');
  }
  
  // Deletar imagem se existir
  if (post.imagem) {
    const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts', post.imagem);
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Erro ao deletar imagem:', err);
    });
  }
  
  await post.destroy();
  
  res.status(200).json({
    success: true,
    message: 'Post deletado com sucesso'
  });
});

// GET /posts/search?q=termo - Buscar posts por termo
exports.search = asyncHandler(async (req, res) => {
  const termo = req.query.q;
  
  if (!termo) {
    throw ApiError.badRequest('Termo de busca é obrigatório');
  }
  
  const posts = await Post.findAll({
    where: {
      [Op.or]: [
        { titulo: { [Op.like]: `%${termo}%` } },
        { conteudo: { [Op.like]: `%${termo}%` } },
        { materia: { [Op.like]: `%${termo}%` } }
      ]
    },
    include: { model: Usuario, attributes: ['id', 'nome', 'email'] },
    order: [['data_criacao', 'DESC']]
  });
  
  res.status(200).json({
    success: true,
    data: posts,
    count: posts.length,
    termo: termo
  });
});
