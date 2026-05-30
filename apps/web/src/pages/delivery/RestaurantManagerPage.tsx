import { ComingSoonPage } from '../services/ComingSoonPage';

export function RestaurantManagerPage() {
  return (
    <ComingSoonPage
      title="Gerenciar restaurante"
      subtitle="Cardápio · Pedidos · Configurações"
      accent="coral"
      backTo="/delivery"
      backLabel="Voltar para Delivery"
      description="Painel completo para o dono do restaurante: cadastre o cardápio, organize em seções, receba pedidos em tempo real, atualize o status e gerencie a operação inteira do seu negócio."
      features={[
        'Cadastro de cardápio com fotos e seções',
        'Toggle aberto/fechado em tempo real',
        'Fila de pedidos com botões de status',
        'Configuração de taxa de entrega e pedido mínimo',
        'Cadastro de chave PIX para receber',
      ]}
    />
  );
}
