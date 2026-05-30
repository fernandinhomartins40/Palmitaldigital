import { ComingSoonPage } from '../services/ComingSoonPage';

export function RideRequestPage() {
  return (
    <ComingSoonPage
      title="Pedir corrida"
      subtitle="Origem · Destino · Confirmar"
      accent="cobalt"
      backTo="/rides"
      backLabel="Voltar para Mobilidade"
      description="Em breve você poderá pedir uma corrida em poucos toques. Selecione o ponto de partida e o destino no mapa, confirme o valor estimado e aguarde um motorista próximo aceitar."
      features={[
        'Mapa interativo com origem e destino',
        'Estimativa de distância e preço',
        'Histórico de endereços salvos',
        'Anotações para o motorista',
      ]}
    />
  );
}
