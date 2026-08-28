import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export default async function globalTeardown() {
  console.log('🧹 Global Teardown: Cleaning E2E test data...');

  try {
    await prisma.pedidoEvento.deleteMany({
      where: { pedido: { numero_sequencial: { gte: 9000 } } },
    });

    await prisma.itemPedido.deleteMany({
      where: { id: { startsWith: 'e2e-item-' } },
    });

    await prisma.pagamento.deleteMany({
      where: { idempotency_key: { startsWith: 'e2e-' } },
    });

    await prisma.pedido.deleteMany({
      where: { numero_sequencial: { gte: 9000 } },
    });

    await prisma.endereco.deleteMany({
      where: { id: { startsWith: 'e2e-' } },
    });

    await prisma.cupom.deleteMany({
      where: { codigo: 'E2ETEST10' },
    });

    await prisma.usuarioPerfil.deleteMany({
      where: { usuario: { email: { endsWith: '@e2e.test' } } },
    });

    await prisma.usuario.deleteMany({
      where: { email: { endsWith: '@e2e.test' } },
    });

    console.log('✅ E2E test data cleaned up');
  } catch (error) {
    console.error('⚠️ Cleanup warning:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('🎭 Global teardown complete');
}
