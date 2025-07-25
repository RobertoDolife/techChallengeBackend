const app = require('./src/app');
const db = require('./src/models');
const {env} = require('./src/common/env')

db.sequelize.authenticate()
  .then(() => {
    console.log('Conectado ao banco com sucesso!');
    return db.sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('🛠️ Modelos sincronizados com o banco');
    app.listen(env.PORT, () => console.log(`Servidor rodando na porta ${env.PORT}`));
  })
  .catch(err => {
    console.error('Erro ao conectar com o banco:', err);
  });
