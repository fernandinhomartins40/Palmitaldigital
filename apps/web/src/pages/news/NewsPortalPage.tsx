import { ComingSoonPage } from '../services/ComingSoonPage';

export function NewsPortalPage() {
  return (
    <ComingSoonPage
      title="Notícias de Palmital"
      subtitle="Jornalismo · Blog · Cidade"
      accent="magenta"
      description="O portal de notícias da cidade — feito por jornalistas e blogueiros credenciados de Palmital. Acompanhe política, cultura, esportes, economia local e tudo que acontece na sua região."
      features={[
        'Manchete em destaque + grade de notícias',
        'Categorias coloridas (Cidade, Política, Esportes...)',
        'Artigos longos com formatação Markdown',
        'Comentários moderados pelo autor',
        'Compartilhamento e leitura offline',
      ]}
    />
  );
}
