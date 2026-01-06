const bcrypt = require('bcrypt');

const senhaTexto = 'senha123';
const hashDoBanco = '$2b$10$ccg4pYE8Wn.Qg3XIXf1HauvlNvbWwu5vZwTRTc3lhDsf4ane7q2UK';

bcrypt.compare(senhaTexto, hashDoBanco).then(result => {
  console.log('Senha "senha123" corresponde ao hash?', result);
  
  if (result) {
    console.log('✅ O hash está CORRETO! A senha é realmente "senha123"');
  } else {
    console.log('❌ O hash NÃO corresponde à senha "senha123"');
    console.log('Teste gerando novo hash:');
    bcrypt.hash(senhaTexto, 10).then(newHash => {
      console.log('Novo hash gerado:', newHash);
    });
  }
}).catch(err => {
  console.error('Erro ao comparar:', err);
});
