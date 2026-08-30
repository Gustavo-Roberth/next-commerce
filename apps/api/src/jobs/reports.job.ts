import cron from 'node-cron';
import { processarAgendamentosVencidos } from '../reports/service.js';

let iniciado = false;

export function configurarRelatoriosJob(): void {
  if (iniciado) return;
  if (process.env.REPORTS_JOB_ENABLED === 'false') return;
  iniciado = true;
  cron.schedule('* * * * *', async () => {
    try {
      await processarAgendamentosVencidos();
    } catch (erro) {
      console.error('Erro no job de relatórios agendados:', erro);
    }
  });
}
