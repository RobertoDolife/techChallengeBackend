const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false,
  }
);

const Usuario = require('./usuario.model')(sequelize);
const Post = require('./post.model')(sequelize);

Usuario.hasMany(Post, { foreignKey: 'usuario_id' });
Post.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = { sequelize, Sequelize, Usuario, Post };
