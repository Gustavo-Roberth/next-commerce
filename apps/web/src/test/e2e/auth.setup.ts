import { expect, test as setup } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ADMIN_EMAIL = 'admin@nextcommerce.com';
const ADMIN_PASSWORD = 'admin123456';
const CLIENT_EMAIL = 'client@e2e.test';
const CLIENT_PASSWORD = 'Client@123';

async function loginAndSaveStorageState(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password: string,
  storagePath: string
) {
  const response = await request.post('/api/v1/auth/login', {
    data: { email, password },
  });

  expect(response.ok()).toBeTruthy();
  const { access_token, refresh_token } = await response.json();

  await request.storageState({ path: storagePath });
  console.log(`✅ Storage state saved to ${storagePath}`);

  return { access_token, refresh_token };
}

setup('authenticate as admin', async ({ request }) => {
  await loginAndSaveStorageState(request, ADMIN_EMAIL, ADMIN_PASSWORD, 'tmp/admin-auth.json');
});

setup('authenticate as client', async ({ request }) => {
  await loginAndSaveStorageState(request, CLIENT_EMAIL, CLIENT_PASSWORD, 'tmp/client-auth.json');
});

setup('authenticate as operator', async ({ request }) => {
  await loginAndSaveStorageState(
    request,
    'operator@e2e.test',
    'Operator@123',
    'tmp/operator-auth.json'
  );
});

setup('ensure E2E users exist', async () => {
  const adminPerfil = await prisma.perfil.findUnique({ where: { codigo: 'ADMIN' } });
  const clientePerfil = await prisma.perfil.findUnique({ where: { codigo: 'CLIENTE' } });
  const operadorPerfil = await prisma.perfil.findUnique({ where: { codigo: 'OPERADOR' } });
  const lojaDemo = await prisma.loja.findUnique({ where: { slug: 'demo' } });

  if (!adminPerfil || !clientePerfil || !operadorPerfil || !lojaDemo) {
    throw new Error('Required profiles or demo store not found. Run db:seed:e2e first.');
  }

  const { createHash } = await import('node:crypto');
  function hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  await prisma.usuario.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      nome_completo: 'Admin E2E',
      senha_hash: hashPassword(ADMIN_PASSWORD),
      ativo: true,
      email_verificado_em: new Date(),
    },
  });

  await prisma.usuarioPerfil.upsert({
    where: {
      usuario_id_perfil_id_loja_id: {
        usuario_id: (await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } })).id,
        perfil_id: adminPerfil.id,
        loja_id: lojaDemo.id,
      },
    },
    update: {},
    create: {
      usuario_id: (await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } })).id,
      perfil_id: adminPerfil.id,
      loja_id: lojaDemo.id,
      ativo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: CLIENT_EMAIL },
    update: {},
    create: {
      email: CLIENT_EMAIL,
      nome_completo: 'Cliente E2E',
      senha_hash: hashPassword(CLIENT_PASSWORD),
      ativo: true,
      email_verificado_em: new Date(),
    },
  });

  await prisma.usuarioPerfil.upsert({
    where: {
      usuario_id_perfil_id_loja_id: {
        usuario_id: (await prisma.usuario.findUnique({ where: { email: CLIENT_EMAIL } })).id,
        perfil_id: clientePerfil.id,
        loja_id: lojaDemo.id,
      },
    },
    update: {},
    create: {
      usuario_id: (await prisma.usuario.findUnique({ where: { email: CLIENT_EMAIL } })).id,
      perfil_id: clientePerfil.id,
      loja_id: lojaDemo.id,
      ativo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'operator@e2e.test' },
    update: {},
    create: {
      email: 'operator@e2e.test',
      nome_completo: 'Operador E2E',
      senha_hash: hashPassword('Operator@123'),
      ativo: true,
      email_verificado_em: new Date(),
    },
  });

  await prisma.usuarioPerfil.upsert({
    where: {
      usuario_id_perfil_id_loja_id: {
        usuario_id: (await prisma.usuario.findUnique({ where: { email: 'operator@e2e.test' } })).id,
        perfil_id: operadorPerfil.id,
        loja_id: lojaDemo.id,
      },
    },
    update: {},
    create: {
      usuario_id: (await prisma.usuario.findUnique({ where: { email: 'operator@e2e.test' } })).id,
      perfil_id: operadorPerfil.id,
      loja_id: lojaDemo.id,
      ativo: true,
    },
  });

  console.log('✅ E2E users verified/created');
});
