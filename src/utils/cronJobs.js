// src/utils/cronJobs.js
const cron = require('node-cron');
const IdealSoftService = require('../services/idealSoftService');

module.exports = {
  initCronJobs: function() {
    // Exemplo: a cada 10 horas -> 0 */10 * * *
    // (ajuste conforme sua necessidade de intervalo)
    cron.schedule('0 */10 * * *', async () => {
      console.log('Renovando token da IdealSoft...');
      try {
        await IdealSoftService.autenticar('SUA_SERIE', 1);
        console.log('Token renovado com sucesso!');
      } catch (error) {
        console.error('Falha ao renovar token:', error.message);
      }
    });
  }
};
