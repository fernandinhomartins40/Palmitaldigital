import { ComingSoonPage } from '../services/ComingSoonPage';

export function ArticlePage() {
  return (
    <ComingSoonPage
      title="Leitor de artigo"
      subtitle="Tipografia editorial"
      accent="magenta"
      backTo="/news"
      backLabel="Voltar ao portal"
      description="Página de leitura focada: capa em destaque, tipografia editorial confortável, autor em evidência, categoria colorida, tags e comentários ao final."
      features={[
        'Capa full-bleed + título display',
        'Corpo em Markdown renderizado',
        'Bio do autor + outros artigos dele',
        'Comentários (reusa engine do feed)',
        'Compartilhar via WhatsApp / link',
      ]}
    />
  );
}
