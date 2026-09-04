import cron from 'node-cron';

export interface JobDefinition {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  enabledEnv?: string;
  timezone?: string;
}

const registeredJobs: Array<{
  task: cron.ScheduledTask;
  definition: JobDefinition;
}> = [];

let isStarted = false;

function isEnabled(definition: JobDefinition): boolean {
  if (!definition.enabledEnv) return true;
  const value = process.env[definition.enabledEnv];
  if (value === undefined) return true;
  return value.toLowerCase() !== 'false';
}

function createWrappedHandler(definition: JobDefinition) {
  return async () => {
    const start = Date.now();
    try {
      await definition.handler();
      const duration = Date.now() - start;
      console.log(`[Job:${definition.name}] Concluído em ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[Job:${definition.name}] Falhou após ${duration}ms:`, error);
    }
  };
}

export function registerJob(definition: JobDefinition): void {
  if (isStarted) {
    console.warn(`[Job:${definition.name}] Registro ignorado: jobs já iniciados`);
    return;
  }

  if (!isEnabled(definition)) {
    console.log(`[Job:${definition.name}] Desabilitado via ${definition.enabledEnv}`);
    return;
  }

  const wrappedHandler = createWrappedHandler(definition);
  const task = cron.schedule(definition.schedule, wrappedHandler, {
    scheduled: false,
    timezone: definition.timezone ?? 'UTC',
  });

  registeredJobs.push({ task, definition });
  console.log(`[Job:${definition.name}] Registrado (${definition.schedule})`);
}

export function startAllJobs(): void {
  if (isStarted) {
    console.warn('[Jobs] Já iniciados');
    return;
  }

  for (const { task, definition } of registeredJobs) {
    task.start();
    console.log(`[Job:${definition.name}] Iniciado`);
  }

  isStarted = true;
  console.log(`[Jobs] ${registeredJobs.length} job(s) ativo(s)`);
}

export function stopAllJobs(): void {
  for (const { task, definition } of registeredJobs) {
    task.stop();
    console.log(`[Job:${definition.name}] Parado`);
  }

  registeredJobs.length = 0;
  isStarted = false;
  console.log('[Jobs] Todos os jobs parados');
}

export function getRegisteredJobs(): ReadonlyArray<JobDefinition> {
  return registeredJobs.map(({ definition }) => definition);
}
