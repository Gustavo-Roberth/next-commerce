import 'dotenv/config';
import { createHash } from 'node:crypto';
import { type Prisma, PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // 1. Criar Perfis de Sistema
  console.log('📋 Criando perfis de sistema...');

  const perfisSistema: Prisma.PerfilCreateInput[] = [
    {
      codigo: 'ADMIN',
      nome: 'Administrador',
      descricao: 'Acesso total ao sistema (configurações, usuários, integrações, tudo)',
      permissoes: {
        'loja:read': true,
        'loja:write': true,
        'loja:delete': true,
        'usuario:read': true,
        'usuario:write': true,
        'usuario:delete': true,
        'perfil:read': true,
        'perfil:write': true,
        'perfil:delete': true,
        'produto:read': true,
        'produto:write': true,
        'produto:delete': true,
        'categoria:read': true,
        'categoria:write': true,
        'categoria:delete': true,
        'pedido:read': true,
        'pedido:write': true,
        'pedido:delete': true,
        'estoque:read': true,
        'estoque:write': true,
        'estoque:delete': true,
        'financeiro:read': true,
        'financeiro:write': true,
        'relatorio:read': true,
        'relatorio:write': true,
        'configuracao:read': true,
        'configuracao:write': true,
        'integracao:read': true,
        'integracao:write': true,
        'auditoria:read': true,
      },
    },
    {
      codigo: 'GESTOR',
      nome: 'Gestor',
      descricao: 'Leitura total + relatórios + dashboards (sem escrita em cadastros)',
      permissoes: {
        'loja:read': true,
        'usuario:read': true,
        'perfil:read': true,
        'produto:read': true,
        'categoria:read': true,
        'pedido:read': true,
        'estoque:read': true,
        'financeiro:read': true,
        'relatorio:read': true,
        'relatorio:write': true,
        'configuracao:read': true,
        'auditoria:read': true,
      },
    },
    {
      codigo: 'OPERADOR',
      nome: 'Operador',
      descricao: 'Pedidos (leitura/escrita), catálogo (leitura/escrita), clientes (leitura)',
      permissoes: {
        'loja:read': true,
        'usuario:read': true,
        'produto:read': true,
        'produto:write': true,
        'categoria:read': true,
        'categoria:write': true,
        'pedido:read': true,
        'pedido:write': true,
        'cliente:read': true,
        'relatorio:read': true,
      },
    },
    {
      codigo: 'ESTOQUISTA',
      nome: 'Estoquista',
      descricao: 'Estoque (leitura/escrita), separação de pedidos, inventário',
      permissoes: {
        'loja:read': true,
        'produto:read': true,
        'categoria:read': true,
        'pedido:read': true,
        'estoque:read': true,
        'estoque:write': true,
        'inventario:write': true,
      },
    },
    {
      codigo: 'CLIENTE',
      nome: 'Cliente',
      descricao: 'Próprio perfil, endereços, pedidos, carrinho, favoritos, avaliações',
      permissoes: {
        'perfil:read': true,
        'perfil:write': true,
        'endereco:read': true,
        'endereco:write': true,
        'endereco:delete': true,
        'pedido:read': true,
        'carrinho:read': true,
        'carrinho:write': true,
        'carrinho:delete': true,
        'favorito:read': true,
        'favorito:write': true,
        'favorito:delete': true,
        'avaliacao:read': true,
        'avaliacao:write': true,
      },
    },
  ];

  for (const perfil of perfisSistema) {
    await prisma.perfil.upsert({
      where: { codigo: perfil.codigo },
      update: { permissoes: perfil.permissoes, descricao: perfil.descricao },
      create: perfil,
    });
    console.log(`  ✅ Perfil ${perfil.codigo} criado/atualizado`);
  }

  // 2. Criar Loja Demo (se não existir)
  console.log('🏪 Criando loja demo...');
  const lojaDemo = await prisma.loja.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      nome: 'Loja Demo',
      slug: 'demo',
      ativa: true,
      cores_tema: {
        primary: '#3B82F6',
        secondary: '#64748B',
        background: '#FFFFFF',
        text: '#1E293B',
      },
      configuracoes_seo: {
        meta_title_template: '{produto} - {loja}',
        meta_description_template: 'Compre {produto} na {loja}. Entrega rápida e segura.',
      },
    },
  });
  console.log(`  ✅ Loja demo criada: ${lojaDemo.id}`);

  // 3. Criar Categorias Demo
  console.log('📂 Criando categorias demo...');
  const categorias = [
    { nome: 'Eletrônicos', slug: 'eletronicos', ordem_exibicao: 1 },
    { nome: 'Roupas', slug: 'roupas', ordem_exibicao: 2 },
    { nome: 'Casa e Decoração', slug: 'casa-decoracao', ordem_exibicao: 3 },
    { nome: 'Esportes', slug: 'esportes', ordem_exibicao: 4 },
    { nome: 'Beleza', slug: 'beleza', ordem_exibicao: 5 },
  ];

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { loja_id_slug: { loja_id: lojaDemo.id, slug: cat.slug } },
      update: {},
      create: { ...cat, loja_id: lojaDemo.id },
    });
    console.log(`  ✅ Categoria ${cat.nome} criada`);
  }

  // 4. Criar Depósito Padrão
  console.log('📦 Criando depósito padrão...');
  await prisma.deposito.upsert({
    where: { loja_id_codigo: { loja_id: lojaDemo.id, codigo: 'PRINCIPAL' } },
    update: {},
    create: {
      loja_id: lojaDemo.id,
      nome: 'Depósito Principal',
      codigo: 'PRINCIPAL',
      endereco_completo: 'Endereço do depósito principal',
      padrao: true,
      ativo: true,
    },
  });
  console.log('  ✅ Depósito principal criado');

  // 5. Criar Configuração de Frete Demo
  console.log('🚚 Criando configuração de frete demo...');
  await prisma.configuracaoFrete.upsert({
    where: { id: 'frete-gratis-demo' },
    update: {},
    create: {
      id: 'frete-gratis-demo',
      loja_id: lojaDemo.id,
      nome: 'Frete Grátis acima de R$ 299,90',
      tipo: 'GRATIS_VALOR',
      configuracao: { valor_minimo_cents: 29990 },
      prioridade: 1,
      ativo: true,
    },
  });
  console.log('  ✅ Configuração de frete criada');

  // 6. Criar Usuário Admin Demo
  console.log('👤 Criando usuário admin demo...');
  const senhaHash = hashPassword('Admin@123');
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      nome_completo: 'Administrador Demo',
      senha_hash: senhaHash,
      ativo: true,
      email_verificado_em: new Date(),
    },
  });
  console.log(`  ✅ Usuário admin criado: ${adminUser.id}`);

  // 6.1 Associar Admin à Loja Demo com perfil ADMIN
  const adminPerfil = await prisma.perfil.findUnique({ where: { codigo: 'ADMIN' } });
  if (!adminPerfil) {
    throw new Error('Perfil ADMIN não encontrado após a criação dos perfis de sistema');
  }

  await prisma.usuarioPerfil.upsert({
    where: {
      usuario_id_perfil_id_loja_id: {
        usuario_id: adminUser.id,
        perfil_id: adminPerfil.id,
        loja_id: lojaDemo.id,
      },
    },
    update: {},
    create: {
      usuario_id: adminUser.id,
      perfil_id: adminPerfil.id,
      loja_id: lojaDemo.id,
      ativo: true,
    },
  });
  console.log('  ✅ Perfil ADMIN associado à loja demo');

  // 6.2 Criar Usuário Admin para E2E Tests
  console.log('👤 Criando usuário admin E2E...');
  const e2eSenhaHash = hashPassword('admin123456');
  const e2eAdminUser = await prisma.usuario.upsert({
    where: { email: 'admin@nextcommerce.com' },
    update: {},
    create: {
      email: 'admin@nextcommerce.com',
      nome_completo: 'Admin E2E',
      senha_hash: e2eSenhaHash,
      ativo: true,
      email_verificado_em: new Date(),
    },
  });
  console.log(`  ✅ Usuário admin E2E criado: ${e2eAdminUser.id}`);

  await prisma.usuarioPerfil.upsert({
    where: {
      usuario_id_perfil_id_loja_id: {
        usuario_id: e2eAdminUser.id,
        perfil_id: adminPerfil.id,
        loja_id: lojaDemo.id,
      },
    },
    update: {},
    create: {
      usuario_id: e2eAdminUser.id,
      perfil_id: adminPerfil.id,
      loja_id: lojaDemo.id,
      ativo: true,
    },
  });
  console.log('  ✅ Perfil ADMIN associado ao usuário E2E');

  // 7. Criar Produtos de Exemplo
  console.log('📦 Criando produtos de exemplo...');
  const categoriaEletronicos = await prisma.categoria.findUnique({
    where: { loja_id_slug: { loja_id: lojaDemo.id, slug: 'eletronicos' } },
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

    const deposito = await prisma.deposito.findUnique({
      where: { loja_id_codigo: { loja_id: lojaDemo.id, codigo: 'PRINCIPAL' } },
    });

    if (deposito) {
      const variacoes = await prisma.produtoVariacao.findMany({
        where: { produto_id: produto1.id },
      });

      for (const variacao of variacoes) {
        await prisma.estoque.upsert({
          where: {
            variacao_id_deposito_id: { variacao_id: variacao.id, deposito_id: deposito.id },
          },
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
    }

    console.log(`  ✅ Produto ${produto1.nome} criado com variações e estoque`);
  }

  // 8. Produto Roupas
  const categoriaRoupas = await prisma.categoria.findUnique({
    where: { loja_id_slug: { loja_id: lojaDemo.id, slug: 'roupas' } },
  });

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

    const deposito = await prisma.deposito.findUnique({
      where: { loja_id_codigo: { loja_id: lojaDemo.id, codigo: 'PRINCIPAL' } },
    });

    if (deposito) {
      const variacoes = await prisma.produtoVariacao.findMany({
        where: { produto_id: produto2.id },
      });

      for (const variacao of variacoes) {
        await prisma.estoque.upsert({
          where: {
            variacao_id_deposito_id: { variacao_id: variacao.id, deposito_id: deposito.id },
          },
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
    }

    console.log(`  ✅ Produto ${produto2.nome} criado com variações e estoque`);
  }

  // 9. Criar Cupom de Boas-vindas
  console.log('🎫 Criando cupom de boas-vindas...');
  await prisma.cupom.upsert({
    where: { loja_id_codigo: { loja_id: lojaDemo.id, codigo: 'BEMVINDO10' } },
    update: {},
    create: {
      loja_id: lojaDemo.id,
      codigo: 'BEMVINDO10',
      nome: 'Boas-vindas 10%',
      tipo: 'PERCENTUAL',
      valor: 10,
      valor_minimo_pedido_cents: 5000,
      uso_maximo_por_cliente: 1,
      valido_de: new Date(),
      valido_ate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      primeira_compra_only: true,
      ativo: true,
      status: 'ATIVO',
    },
  });
  console.log('  ✅ Cupom de boas-vindas criado');

  console.log('✅ Seed concluído com sucesso!');
  console.log('\n📋 Resumo:');
  console.log('  - 5 Perfis de sistema');
  console.log('  - 1 Loja demo');
  console.log('  - 5 Categorias');
  console.log('  - 1 Depósito principal');
  console.log('  - 1 Configuração de frete');
  console.log('  - 1 Usuário admin (admin@demo.com / Admin@123)');
  console.log('  - 2 Produtos com variações e estoque');
  console.log('  - 1 Cupom de boas-vindas');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
