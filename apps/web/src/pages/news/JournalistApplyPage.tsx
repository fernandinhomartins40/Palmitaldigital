import { ComingSoonPage } from '../services/ComingSoonPage';

export function JournalistApplyPage() {
  return (
    <ComingSoonPage
      title="Quero ser jornalista"
      subtitle="Credenciamento editorial"
      accent="magenta"
      backTo="/news"
      backLabel="Voltar ao portal"
      description="Solicite credenciamento como jornalista ou blogueiro. Conte sua bio, mostre seu portfólio e explique por que quer publicar no portal. Aprovação por admin garante credibilidade editorial."
      features={[
        'Formulário com bio, portfólio e motivação',
        'Status: pendente · aprovado · rejeitado',
        'Após aprovação, cargo muda para JOURNALIST',
        'Acesso ao editor de artigos',
      ]}
    />
  );
}
