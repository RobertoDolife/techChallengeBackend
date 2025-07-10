const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Post', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    titulo: { type: DataTypes.STRING(60), allowNull: false },
    conteudo: { type: DataTypes.STRING(1000), allowNull: true },
    imagem: { type: DataTypes.STRING(255), allowNull: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'post',
    timestamps: true,
    createdAt: 'data_criacao',
    updatedAt: 'data_atualizacao'
  });
};
