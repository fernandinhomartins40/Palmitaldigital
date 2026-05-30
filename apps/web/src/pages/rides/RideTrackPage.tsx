import { ComingSoonPage } from '../services/ComingSoonPage';

export function RideTrackPage() {
  return (
    <ComingSoonPage
      title="Rastrear corrida"
      subtitle="Acompanhar em tempo real"
      accent="cobalt"
      backTo="/rides"
      backLabel="Voltar para Mobilidade"
      description="Veja o motorista chegando até você em tempo real, confira os dados do veículo e acompanhe o trajeto até o destino. Cancele a qualquer momento se precisar."
      features={[
        'Posição do motorista atualizada via socket',
        'Status: aceito → a caminho → em viagem → concluído',
        'Dados do motorista e placa visíveis',
        'QR PIX para pagamento ao finalizar',
      ]}
    />
  );
}
