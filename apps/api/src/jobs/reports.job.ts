import { processarAgendamentosVencidos } from '../reports/service.js';
import { registerJob } from './index.js';

registerJob({
  name: 'relatorios-agendados',
  schedule: '* * * * *',
  handler: async () => {
    try {
      await processarAgendamentosVencidos();
    } catch (erro) {
      console.error('Erro no job de relatórios agendados:', erro);
    }
  },
  enabledEnv: 'REPORTS_JOB_ENABLED',
  timezone: 'America/Sao_Paulo',
});
