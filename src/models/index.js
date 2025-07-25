const { Sequelize } = require('sequelize');
const {sequelize} = require('../database/sequelize')

const Usuario = require('./usuario.model')(sequelize);
const Post = require('./post.model')(sequelize);

Usuario.hasMany(Post, { foreignKey: 'usuario_id' });
Post.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = { sequelize, Sequelize, Usuario, Post };
