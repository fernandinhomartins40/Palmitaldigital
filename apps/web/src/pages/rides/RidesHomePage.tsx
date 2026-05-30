import { ComingSoonPage } from '../services/ComingSoonPage';

export function RidesHomePage() {
  return (
    <ComingSoonPage
      title="Mobilidade Palmital"
      subtitle="Carros · Moto-táxi · Entregas rápidas"
      accent="cobalt"
      description="Peça uma corrida pela cidade ou cadastre-se como motorista e ganhe rodando em Palmital. Conexão direta entre passageiros e motoristas verificados, sem intermediários."
      features={[
        'Solicitar corrida com origem e destino no mapa',
        'Motoristas próximos recebem ofertas em tempo real',
        'Tracking ao vivo da viagem',
        'Pagamento PIX direto com o motorista',
        'Avaliação mútua após a corrida',
      ]}
    />
  );
}
