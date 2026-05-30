import { ComingSoonPage } from '../services/ComingSoonPage';

export function OrderTrackPage() {
  return (
    <ComingSoonPage
      title="Acompanhar pedido"
      subtitle="Status em tempo real"
      accent="coral"
      backTo="/delivery"
      backLabel="Voltar para Delivery"
      description="Acompanhe seu pedido de ponta a ponta: recebido pelo restaurante, em preparo, pronto, a caminho e entregue. Notificações em cada mudança de status."
      features={[
        'Timeline visual de status (com cores)',
        'Estimativa de tempo restante',
        'QR PIX para pagar antes da entrega',
        'Chat direto com o restaurante',
      ]}
    />
  );
}
