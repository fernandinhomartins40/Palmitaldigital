import { ComingSoonPage } from '../services/ComingSoonPage';

export function RestaurantPage() {
  return (
    <ComingSoonPage
      title="Cardápio do restaurante"
      subtitle="Pratos · Bebidas · Sobremesas"
      accent="coral"
      backTo="/delivery"
      backLabel="Voltar para Delivery"
      description="Veja o cardápio completo organizado por seções, adicione itens ao carrinho e finalize o pedido. Veja avaliações de outros clientes antes de pedir."
      features={[
        'Cardápio em seções (entradas, pratos, bebidas)',
        'Carrinho persistente entre páginas',
        'Notas por item (sem cebola, ponto da carne...)',
        'Informações: pedido mínimo, taxa de entrega, tempo médio',
      ]}
    />
  );
}
