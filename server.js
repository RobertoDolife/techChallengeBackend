const app = require('./src/app');
const { sequelize } = require('./src/database/sequelize')
const {env} = require('./src/common/env')

sequelize.authenticate()
  .then(() => {
    console.log('Conectado ao banco com sucesso!');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('🛠️ Modelos sincronizados com o banco');
    app.listen(env.PORT, () => console.log(`Servidor rodando na porta ${env.PORT}`));
  })
  .catch(err => {
    console.error('Erro ao conectar com o banco:', err);
  });
