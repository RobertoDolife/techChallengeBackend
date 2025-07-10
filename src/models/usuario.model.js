const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    senha: { type: DataTypes.STRING(255), allowNull: false },
  }, {
    tableName: 'usuario',
    timestamps: true,
    createdAt: 'data_criacao',
    updatedAt: 'data_atualizacao'
  });
};
