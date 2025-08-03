const { Model, DataTypes } = require('sequelize')

const { sequelize } = require('../database/sequelize')

const { User } = require('./user')

class Post extends Model {}

Post.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(60), allowNull: false },
    content: { type: DataTypes.STRING(1000), allowNull: true },
    image: { type: DataTypes.STRING(255), allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' }
  },
  {
    sequelize,
    tableName: 'posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
)

User.hasMany(Post, {
  foreignKey: 'user_id',
  onUpdate: 'cascade',
  onDelete: 'cascade'
})

Post.belongsTo(User, {
  foreignKey: 'user_id'
})

module.exports = { Post }
