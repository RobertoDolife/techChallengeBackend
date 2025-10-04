const db = require('../models');
const Post = db.Post;
const Usuario = db.Usuario;
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

exports.getAll = async (req, res) => {
  try {
    const posts = await Post.findAll({
      order: [['data_criacao', 'DESC']],
      include: { model: Usuario, attributes: ['id', 'nome', 'email'] }
    });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar posts' });
  }
};

exports.getById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: { model: Usuario, attributes: ['id', 'nome', 'email'] }
    });
    if (!post) return res.status(404).json({ erro: 'Post não encontrado' });

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar post' });
  }
};

exports.create = async (req, res) => {
  try {
    const { titulo, conteudo, usuario_id, materia } = req.body;
    if (!titulo || !usuario_id) {
      return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
    }
    const imagem = req.file ? req.file.filename : null;
    const novoPost = await Post.create({ titulo, conteudo, usuario_id, imagem, materia });
    res.status(201).json(novoPost);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar o post.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { titulo, conteudo, materia } = req.body;

    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ erro: 'Post não encontrado' });

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
    await post.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar post' });
  }
};

exports.search = async (req, res) => {
  try {
    const termo = req.query.q;
    if (!termo) return res.status(400).json({ erro: 'Termo de busca ausente' });
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
    res.status(500).json({ erro: 'Erro ao buscar posts' });
  }
};
