import { ComingSoonPage } from '../services/ComingSoonPage';

export function DeliveryHomePage() {
  return (
    <ComingSoonPage
      title="Delivery Palmital"
      subtitle="Restaurantes locais · Entrega ou retirada"
      accent="coral"
      description="Descubra os restaurantes da sua cidade, monte seu pedido e receba em casa ou retire no balcão. Sem comissão da plataforma — o pagamento vai direto para o restaurante via PIX."
      features={[
        'Cardápio com fotos, descrição e preço',
        'Carrinho e checkout simplificado',
        'Pagamento PIX direto com o restaurante',
        'Acompanhamento de status em tempo real',
        'Avaliação após receber o pedido',
      ]}
    />
  );
}
