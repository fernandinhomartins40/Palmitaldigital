import { ComingSoonPage } from '../services/ComingSoonPage';

export function WriteArticlePage() {
  return (
    <ComingSoonPage
      title="Escrever artigo"
      subtitle="Apenas jornalistas credenciados"
      accent="magenta"
      backTo="/news"
      backLabel="Voltar ao portal"
      description="Editor para criação de artigos jornalísticos. Disponível apenas para usuários com cargo JOURNALIST aprovado pelo admin. Salve como rascunho, publique direto ou peça revisão."
      features={[
        'Editor Markdown com preview ao vivo',
        'Upload de capa e imagens no corpo',
        'Categoria, tags e excerpt',
        'Salvar como rascunho · publicar · arquivar',
        'Listagem dos seus artigos com status',
      ]}
    />
  );
}
