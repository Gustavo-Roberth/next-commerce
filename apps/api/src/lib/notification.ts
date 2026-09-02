export async function emitNotification(
  pedidoId: string,
  status: string,
  evento: { data: Date; status: string; local?: string | null; descricao: string }
): Promise<void> {
  const prisma = (await import('../lib/prisma.js')).prisma;

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { cliente: true },
  });

  if (!pedido) return;

  let assunto = '';
  let mensagem = '';

  switch (status) {
    case 'COLETADO':
      assunto = 'Seu pedido foi coletado pela transportadora';
      mensagem = `O pedido #${pedido.numero_sequencial} foi coletado e está a caminho. Código de rastreamento disponível na área do cliente.`;
      break;
    case 'SAIU_ENTREGA':
      assunto = 'Seu pedido saiu para entrega';
      mensagem = `O pedido #${pedido.numero_sequencial} saiu para entrega hoje.`;
      break;
    case 'ENTREGUE':
      assunto = 'Seu pedido foi entregue';
      mensagem = `O pedido #${pedido.numero_sequencial} foi entregue com sucesso. Agradecemos a preferência!`;
      break;
    case 'DEVOLVIDO':
      assunto = 'Seu pedido foi devolvido';
      mensagem = `O pedido #${pedido.numero_sequencial} foi devolvido. Entraremos em contato para resolver.`;
      break;
    default:
      return;
  }

  await prisma.pedidoEvento.create({
    data: {
      pedido_id: pedidoId,
      tipo: 'NOTIFICACAO_RASTREAMENTO',
      descricao: `Notificação enviada: ${assunto}`,
      metadata: { status, evento },
    },
  });

  console.log(`[Notification] Para pedido ${pedidoId}: ${assunto} - ${mensagem}`);
}
