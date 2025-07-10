require('dotenv').config();
const app = require('./src/app');
const db = require('./src/models');
const PORT = process.env.PORT || 3000;

db.sequelize.authenticate()
  .then(() => {
    console.log('Conectado ao banco com sucesso!');
    return db.sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('🛠️ Modelos sincronizados com o banco');
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch(err => {
    console.error('Erro ao conectar com o banco:', err);
  });
