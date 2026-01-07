const bcrypt = require('bcrypt');

const usuarios = [
  'roberto.silva@example.com',
  'maria.souza@example.com',
  'ana.pereira@example.com',
  'carlos.oliveira@example.com',
  'mariana.costa@example.com',
  'felipe.almeida@example.com',
  'juliana.rocha@example.com',
  'pedro.santos@example.com',
  'larissa.ferreira@example.com',
  'gustavo.martins@example.com',
  'beatriz.gomes@example.com',
  'rafael.almeida@example.com',
  'patricia.nunes@example.com',
  'andre.ribeiro@example.com',
  'sofia.barros@example.com',
  'lucas.ferreira@example.com',
  'camila.pinto@example.com',
  'mateus.cardoso@example.com',
  'isabela.duarte@example.com',
  'thiago.moreira@example.com'
];

const senha = 'senha123';

(async () => {
  console.log('-- Hashes bcrypt para senha123');
  for (const email of usuarios) {
    const hash = await bcrypt.hash(senha, 10);
    console.log(`-- ${email}: ${hash}`);
  }
})();
