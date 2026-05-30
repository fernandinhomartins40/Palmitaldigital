import { ComingSoonPage } from '../services/ComingSoonPage';

export function DriverDashboardPage() {
  return (
    <ComingSoonPage
      title="Painel do motorista"
      subtitle="Ganhos · Corridas · Status"
      accent="cobalt"
      backTo="/rides"
      backLabel="Voltar para Mobilidade"
      description="Seu painel completo de motorista — fique online para receber chamadas, aceite corridas próximas, acompanhe seus ganhos e mantenha seus dados sempre atualizados."
      features={[
        'Toggle online/offline',
        'Notificações de corridas próximas em tempo real',
        'Histórico de corridas e avaliações',
        'Cadastro de chave PIX para receber pagamentos',
      ]}
    />
  );
}
