import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('🌱 Iniciando seed E2E...');

  const lojaDemo = await prisma.loja.findUnique({ where: { slug: 'demo' } });
  if (!lojaDemo) {
    throw new Error('Loja demo não encontrada. Rode o seed principal primeiro.');
  }
  console.log(`  ✅ Loja demo encontrada: ${lojaDemo.id}`);

  const adminPerfil = await prisma.perfil.findUnique({ where: { codigo: 'ADMIN' } });
  if (!adminPerfil) {
    throw new Error('Perfil ADMIN não encontrado.');
  }

  const clientePerfil = await prisma.perfil.findUnique({ where: { codigo: 'CLIENTE' } });
  if (!clientePerfil) {
    throw new Error('Perfil CLIENTE não encontrado.');
  }

  const operadorPerfil = await prisma.perfil.findUnique({ where: { codigo: 'OPERADOR' } });
  if (!operadorPerfil) {
    throw new Error('Perfil OPERADOR não encontrado.');
  }

  const deposito = await prisma.deposito.findUnique({
    where: { loja_id_codigo: { loja_id: lojaDemo.id, codigo: 'PRINCIPAL' } },
  });
  if (!deposito) {
    throw new Error('Depósito principal não encontrado.');
  }

  console.log('👤 Criando/atualizando usuário cliente E2E...');
  const clienteSenhaHash = hashPassword('Client@123');
  const clienteUser = await prisma.usuario.upsert({
    where: { email: 'client@e2e.test' },
    update: {},
    create: {
      email: 'client@e2e.test',
      nome_completo: 'Cliente E2E',
      senha_hash: clienteSenhaHash,
      ativo: true,
      email_verificado_em: new Date(),
    },
  });
  console.log(`  ✅ Cliente E2E: ${clienteUser.id}`);

  await prisma.usuarioPerfil.upsert({
    where: {
      usuario_id_perfil_id_loja_id: {
        usuario_id: clienteUser.id,
        perfil_id: clientePerfil.id,
        loja_id: lojaDemo.id,
      },
    },
    update: {},
    create: {
      usuario_id: clienteUser.id,
      perfil_id: clientePerfil.id,
      loja_id: lojaDemo.id,
      ativo: true,
    },
  });
  console.log('  ✅ Perfil CLIENTE associado ao cliente E2E');

  console.log('👤 Criando/atualizando usuário operador E2E...');
  const operadorSenhaHash = hashPassword('Operator@123');
  const operadorUser = await prisma.usuario.upsert({
    where: { email: 'operator@e2e.test' },
    update: {},
    create: {
      email: 'operator@e2e.test',
      nome_completo: 'Operador E2E',
      senha_hash: operadorSenhaHash,
      ativo: true,
      email_verificado_em: new Date(),
    },
  });
  console.log(`  ✅ Operador E2E: ${operadorUser.id}`);

  await prisma.usuarioPerfil.upsert({
    where: {
      usuario_id_perfil_id_loja_id: {
        usuario_id: operadorUser.id,
        perfil_id: operadorPerfil.id,
        loja_id: lojaDemo.id,
      },
    },
    update: {},
    create: {
      usuario_id: operadorUser.id,
      perfil_id: operadorPerfil.id,
      loja_id: lojaDemo.id,
      ativo: true,
    },
  });
  console.log('  ✅ Perfil OPERADOR associado ao operador E2E');

  console.log('📦 Garantindo produtos para E2E...');
  const categoriaEletronicos = await prisma.categoria.findUnique({
    where: { loja_id_slug: { loja_id: lojaDemo.id, slug: 'eletronicos' } },
  });
  const categoriaRoupas = await prisma.categoria.findUnique({
    where: { loja_id_slug: { loja_id: lojaDemo.id, slug: 'roupas' } },
  });

  if (categoriaEletronicos) {
    const produto1 = await prisma.produto.upsert({
      where: { loja_id_slug: { loja_id: lojaDemo.id, slug: 'smartphone-xyz' } },
      update: {},
      create: {
        loja_id: lojaDemo.id,
        categoria_id: categoriaEletronicos.id,
        nome: 'Smartphone XYZ Pro',
        slug: 'smartphone-xyz',
        descricao_curta: 'Smartphone topo de linha com câmera de 108MP',
        descricao_completa: '<p>O Smartphone XYZ Pro traz o melhor da tecnologia móvel...</p>',
        sku: 'SMART-XYZ-PRO-001',
        codigo_barras: '7891234567890',
        ncm: '85171200',
        origem_mercadoria: 0,
        peso_bruto_kg: 0.25,
        peso_liquido_kg: 0.2,
        dimensoes_cm: { altura: 15.5, largura: 7.5, comprimento: 0.8 },
        ativo: true,
        destaque: true,
        permite_avaliacao: true,
        status: 'ATIVO',
        publicado_em: new Date(),
      },
    });

    await prisma.produtoVariacao.upsert({
      where: { produto_id_sku: { produto_id: produto1.id, sku: 'SMART-XYZ-PRO-001-PRETO-128' } },
      update: {},
      create: {
        produto_id: produto1.id,
        sku: 'SMART-XYZ-PRO-001-PRETO-128',
        nome: 'Preto / 128GB',
        preco_cents: 349900,
        custo_cents: 210000,
        ativo: true,
        ordem_exibicao: 1,
      },
    });

    await prisma.produtoVariacao.upsert({
      where: { produto_id_sku: { produto_id: produto1.id, sku: 'SMART-XYZ-PRO-001-BRANCO-256' } },
      update: {},
      create: {
        produto_id: produto1.id,
        sku: 'SMART-XYZ-PRO-001-BRANCO-256',
        nome: 'Branco / 256GB',
        preco_cents: 399900,
        custo_cents: 240000,
        ativo: true,
        ordem_exibicao: 2,
      },
    });

    const variacoes = await prisma.produtoVariacao.findMany({ where: { produto_id: produto1.id } });
    for (const variacao of variacoes) {
      await prisma.estoque.upsert({
        where: { variacao_id_deposito_id: { variacao_id: variacao.id, deposito_id: deposito.id } },
        update: {},
        create: {
          loja_id: lojaDemo.id,
          variacao_id: variacao.id,
          deposito_id: deposito.id,
          quantidade_fisica: 50,
          quantidade_minima: 5,
          custo_medio_cents: variacao.custo_cents ?? 0,
        },
      });
    }
    console.log(`  ✅ Produto ${produto1.nome} com variações e estoque`);
  }

  if (categoriaRoupas) {
    const produto2 = await prisma.produto.upsert({
      where: { loja_id_slug: { loja_id: lojaDemo.id, slug: 'camiseta-basica' } },
      update: {},
      create: {
        loja_id: lojaDemo.id,
        categoria_id: categoriaRoupas.id,
        nome: 'Camiseta Básica Premium',
        slug: 'camiseta-basica',
        descricao_curta: 'Camiseta 100% algodão, confortável e durável',
        descricao_completa: '<p>Camiseta básica premium feita com algodão orgânico...</p>',
        sku: 'CAMISA-BASIC-001',
        codigo_barras: '7891234567891',
        ncm: '61091000',
        origem_mercadoria: 0,
        peso_bruto_kg: 0.15,
        peso_liquido_kg: 0.12,
        dimensoes_cm: { altura: 28, largura: 20, comprimento: 2 },
        ativo: true,
        destaque: false,
        permite_avaliacao: true,
        status: 'ATIVO',
        publicado_em: new Date(),
      },
    });

    await prisma.produtoVariacao.upsert({
      where: { produto_id_sku: { produto_id: produto2.id, sku: 'CAMISA-BASIC-001-P-M' } },
      update: {},
      create: {
        produto_id: produto2.id,
        sku: 'CAMISA-BASIC-001-P-M',
        nome: 'Preto / M',
        preco_cents: 7990,
        custo_cents: 3500,
        ativo: true,
        ordem_exibicao: 1,
      },
    });

    await prisma.produtoVariacao.upsert({
      where: { produto_id_sku: { produto_id: produto2.id, sku: 'CAMISA-BASIC-001-B-G' } },
      update: {},
      create: {
        produto_id: produto2.id,
        sku: 'CAMISA-BASIC-001-B-G',
        nome: 'Branco / G',
        preco_cents: 7990,
        custo_cents: 3500,
        ativo: true,
        ordem_exibicao: 2,
      },
    });

    const variacoes = await prisma.produtoVariacao.findMany({ where: { produto_id: produto2.id } });
    for (const variacao of variacoes) {
      await prisma.estoque.upsert({
        where: { variacao_id_deposito_id: { variacao_id: variacao.id, deposito_id: deposito.id } },
        update: {},
        create: {
          loja_id: lojaDemo.id,
          variacao_id: variacao.id,
          deposito_id: deposito.id,
          quantidade_fisica: 100,
          quantidade_minima: 10,
          custo_medio_cents: variacao.custo_cents ?? 0,
        },
      });
    }
    console.log(`  ✅ Produto ${produto2.nome} com variações e estoque`);
  }

  console.log('📋 Criando pedidos de teste para E2E...');
  const variacaoCamiseta = await prisma.produtoVariacao.findFirst({
    where: { sku: 'CAMISA-BASIC-001-P-M' },
    include: { produto: true },
  });

  const variacaoSmartphone = await prisma.produtoVariacao.findFirst({
    where: { sku: 'SMART-XYZ-PRO-001-PRETO-128' },
    include: { produto: true },
  });

  if (variacaoCamiseta && variacaoSmartphone) {
    const enderecoEntrega = await prisma.endereco.upsert({
      where: { id: 'e2e-endereco-entrega' },
      update: {},
      create: {
        id: 'e2e-endereco-entrega',
        usuario_id: clienteUser.id,
        tipo: 'ENTREGA',
        cep: '01000-000',
        logradouro: 'Rua Teste',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        pais: 'BRA',
        principal: true,
      },
    });

    const enderecoCobranca = await prisma.endereco.upsert({
      where: { id: 'e2e-endereco-cobranca' },
      update: {},
      create: {
        id: 'e2e-endereco-cobranca',
        usuario_id: clienteUser.id,
        tipo: 'COBRANCA',
        cep: '01000-000',
        logradouro: 'Rua Teste',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        pais: 'BRA',
        principal: true,
      },
    });

    const pedidoPago = await prisma.pedido.upsert({
      where: { loja_id_numero_sequencial: { loja_id: lojaDemo.id, numero_sequencial: 9001 } },
      update: {},
      create: {
        loja_id: lojaDemo.id,
        cliente_id: clienteUser.id,
        numero_sequencial: 9001,
        status: 'PAGO',
        subtotal_cents: 7990,
        frete_cents: 0,
        total_cents: 7990,
        endereco_entrega_id: enderecoEntrega.id,
        endereco_cobranca_id: enderecoCobranca.id,
        pago_em: new Date(),
      },
    });

    await prisma.itemPedido.upsert({
      where: { id: 'e2e-item-9001' },
      update: {},
      create: {
        id: 'e2e-item-9001',
        pedido_id: pedidoPago.id,
        produto_id: variacaoCamiseta.produto_id,
        variacao_id: variacaoCamiseta.id,
        nome_produto: variacaoCamiseta.produto.nome,
        sku: variacaoCamiseta.sku,
        quantidade: 1,
        preco_unitario_cents: 7990,
        total_cents: 7990,
      },
    });

    await prisma.pagamento.upsert({
      where: { id: 'e2e-pag-9001' },
      update: {},
      create: {
        id: 'e2e-pag-9001',
        pedido_id: pedidoPago.id,
        gateway: 'MERCADO_PAGO',
        metodo: 'PIX',
        status: 'APROVADO',
        valor_cents: 7990,
        idempotency_key: 'e2e-pix-9001',
        aprovado_em: new Date(),
      },
    });

    await prisma.pedidoEvento.create({
      data: {
        pedido_id: pedidoPago.id,
        tipo: 'STATUS_ALTERADO',
        descricao: 'Status alterado para PAGO',
        metadata: { status_anterior: 'PAGAMENTO_PENDENTE', status_novo: 'PAGO' },
      },
    });

    const pedidoEnviado = await prisma.pedido.upsert({
      where: { loja_id_numero_sequencial: { loja_id: lojaDemo.id, numero_sequencial: 9002 } },
      update: {},
      create: {
        loja_id: lojaDemo.id,
        cliente_id: clienteUser.id,
        numero_sequencial: 9002,
        status: 'ENVIADO',
        subtotal_cents: 349900,
        frete_cents: 0,
        total_cents: 349900,
        endereco_entrega_id: enderecoEntrega.id,
        endereco_cobranca_id: enderecoCobranca.id,
        pago_em: new Date(),
        enviado_em: new Date(),
      },
    });

    await prisma.itemPedido.upsert({
      where: { id: 'e2e-item-9002' },
      update: {},
      create: {
        id: 'e2e-item-9002',
        pedido_id: pedidoEnviado.id,
        produto_id: variacaoSmartphone.produto_id,
        variacao_id: variacaoSmartphone.id,
        nome_produto: variacaoSmartphone.produto.nome,
        sku: variacaoSmartphone.sku,
        quantidade: 1,
        preco_unitario_cents: 349900,
        total_cents: 349900,
      },
    });

    await prisma.pagamento.upsert({
      where: { id: 'e2e-pag-9002' },
      update: {},
      create: {
        id: 'e2e-pag-9002',
        pedido_id: pedidoEnviado.id,
        gateway: 'MERCADO_PAGO',
        metodo: 'PIX',
        status: 'APROVADO',
        valor_cents: 349900,
        idempotency_key: 'e2e-pix-9002',
        aprovado_em: new Date(),
      },
    });

    await prisma.pedidoEvento.create({
      data: {
        pedido_id: pedidoEnviado.id,
        tipo: 'STATUS_ALTERADO',
        descricao: 'Status alterado para ENVIADO',
        metadata: { status_anterior: 'PAGO', status_novo: 'ENVIADO' },
      },
    });

    const pedidoEntregue = await prisma.pedido.upsert({
      where: { loja_id_numero_sequencial: { loja_id: lojaDemo.id, numero_sequencial: 9003 } },
      update: {},
      create: {
        loja_id: lojaDemo.id,
        cliente_id: clienteUser.id,
        numero_sequencial: 9003,
        status: 'ENTREGUE',
        subtotal_cents: 7990,
        frete_cents: 0,
        total_cents: 7990,
        endereco_entrega_id: enderecoEntrega.id,
        endereco_cobranca_id: enderecoCobranca.id,
        pago_em: new Date(),
        enviado_em: new Date(),
        entregue_em: new Date(),
      },
    });

    await prisma.itemPedido.upsert({
      where: { id: 'e2e-item-9003' },
      update: {},
      create: {
        id: 'e2e-item-9003',
        pedido_id: pedidoEntregue.id,
        produto_id: variacaoCamiseta.produto_id,
        variacao_id: variacaoCamiseta.id,
        nome_produto: variacaoCamiseta.produto.nome,
        sku: variacaoCamiseta.sku,
        quantidade: 1,
        preco_unitario_cents: 7990,
        total_cents: 7990,
      },
    });

    await prisma.pagamento.upsert({
      where: { id: 'e2e-pag-9003' },
      update: {},
      create: {
        id: 'e2e-pag-9003',
        pedido_id: pedidoEntregue.id,
        gateway: 'MERCADO_PAGO',
        metodo: 'PIX',
        status: 'APROVADO',
        valor_cents: 7990,
        idempotency_key: 'e2e-pix-9003',
        aprovado_em: new Date(),
      },
    });

    await prisma.pedidoEvento.create({
      data: {
        pedido_id: pedidoEntregue.id,
        tipo: 'STATUS_ALTERADO',
        descricao: 'Status alterado para ENTREGUE',
        metadata: { status_anterior: 'ENVIADO', status_novo: 'ENTREGUE' },
      },
    });

    console.log('  ✅ Pedidos E2E criados (PAGO #9001, ENVIADO #9002, ENTREGUE #9003)');
  }

  console.log('🎫 Garantindo cupom de teste...');
  await prisma.cupom.upsert({
    where: { loja_id_codigo: { loja_id: lojaDemo.id, codigo: 'E2ETEST10' } },
    update: {},
    create: {
      loja_id: lojaDemo.id,
      codigo: 'E2ETEST10',
      nome: 'E2E Test 10%',
      tipo: 'PERCENTUAL',
      valor: 10,
      valor_minimo_pedido_cents: 5000,
      uso_maximo_por_cliente: 1,
      valido_de: new Date(),
      valido_ate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ativo: true,
      status: 'ATIVO',
    },
  });
  console.log('  ✅ Cupom E2E criado');

  console.log('✅ Seed E2E concluído com sucesso!');
  console.log('\n📋 Resumo E2E:');
  console.log('  - 1 Cliente (client@e2e.test / Client@123)');
  console.log('  - 1 Operador (operator@e2e.test / Operator@123)');
  console.log('  - 3 Pedidos (PAGO #9001, ENVIADO #9002, ENTREGUE #9003)');
  console.log('  - 2 Produtos com variações e estoque');
  console.log('  - 1 Cupom (E2ETEST10)');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed E2E:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
