// Script para executar a inserção dos dados dos estudantes
require('dotenv').config();
const { insertStudentsDirectly } = require('./insert-student-data');

// Executar a inserção dos dados
insertStudentsDirectly()
  .then(() => {
    console.log('Processo de inserção concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro durante a inserção dos dados:', error);
    process.exit(1);
  });