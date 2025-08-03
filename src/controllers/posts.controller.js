const { Post } = require('../entities/post')
const { User } = require('../entities/user');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');


exports.getAll = async (req, res) => {
  try {
    const posts = await Post.findAll({
      order: [['created_at', 'DESC']],
      include: { model: User, attributes: ['id', 'name', 'email'] }
    });
    res.status(200).json(posts);
  } catch (err) {
    console.log(err)
    res.status(500).json({ erro: 'Erro ao listar posts' });
  }
};

exports.getById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: { model: User, attributes: ['id', 'name', 'email'] }
    });
    if (!post) return res.status(404).json({ erro: 'Post não encontrado' });

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar post' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, content, user_id } = req.body;
    if (!title || !user_id) {
      return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
    }
    const image = req.file ? req.file.filename : null;
    const novoPost = await Post.create({ title, content, userId: user_id, image });
    res.status(201).json(novoPost);
  } catch (err) {
    console.log(err)
    res.status(500).json({ erro: 'Erro ao criar o post.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, content } = req.body;

    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ erro: 'Post não encontrado' });

    if (req.file && post.image) {
      const oldImagePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts', post.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error('Erro ao deletar imagem antiga:', err);
      });
    }


    const image = req.file ? req.file.filename : post.image;

    const updatedPost = await post.update({ title, content, image });

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
    const term = req.query.q;
    if (!term) return res.status(400).json({ erro: 'Termo de busca ausente' });
    const posts = await Post.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${term}%` } },
          { content: { [Op.like]: `%${term}%` } }
        ]
      },
      include: { model: User, attributes: ['id', 'name'] }
    });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar posts' });
  }
};
