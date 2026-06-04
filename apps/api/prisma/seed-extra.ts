/**
 * seed-extra.ts — delivery, noticias, pedidos e mais produtos
 * Chamado pelo seed.ts principal apos createUsers()
 */
import {
  ArticleStatus,
  OrderStatus,
  OrderType,
  PrismaClient,
  UserRole,
  CompanyOrderStatus,
  StoreSellMode,
  ProductType,
} from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

// Uses the prisma instance passed from seed.ts — no second connection
let prisma: PrismaClient;

function imageUrl(seed: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}
function daysAgo(d: number) {
  return new Date(Date.now() - d * 86_400_000);
}
function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000);
}

// ─── DELIVERY ────────────────────────────────────────────────────────────────

const RESTAURANT_DOMAIN = '@palmital.test';

const restaurants = [
  {
    email: `pizzaria.bella${RESTAURANT_DOMAIN}`,
    name: 'Pizzaria Bella Napoli',
    slug: 'bella-napoli',
    description: 'Pizzas artesanais no forno a lenha, com ingredientes importados e massa longa fermentação.',
    cuisine: 'Italiana',
    phone: '18997200001',
    address: 'Rua das Flores, 120 — Centro',
    city: 'Palmital',
    deliveryFee: 5.0,
    minOrder: 30.0,
    avgPrepMinutes: 35,
    menu: [
      {
        section: 'Pizzas Tradicionais',
        items: [
          { name: 'Margherita', description: 'Molho de tomate, mussarela e manjericão fresco', price: 42.0, imageSeed: 'pizza-margherita' },
          { name: 'Calabresa', description: 'Calabresa fatiada, cebola e azeitona', price: 44.0, imageSeed: 'pizza-calabresa' },
          { name: 'Quatro Queijos', description: 'Mussarela, provolone, gorgonzola e parmesão', price: 52.0, imageSeed: 'pizza-4queijos' },
          { name: 'Frango com Catupiry', description: 'Frango desfiado, catupiry e milho verde', price: 48.0, imageSeed: 'pizza-frango' },
        ],
      },
      {
        section: 'Pizzas Especiais',
        items: [
          { name: 'Portuguesa', description: 'Presunto, ovo, cebola, azeitona e ervilha', price: 54.0, imageSeed: 'pizza-portuguesa' },
          { name: 'Napolitana', description: 'Tomate fresco, alho e manjericão', price: 50.0, imageSeed: 'pizza-napolitana' },
        ],
      },
      {
        section: 'Bebidas',
        items: [
          { name: 'Coca-Cola 2L', description: 'Refrigerante gelado', price: 12.0, imageSeed: 'coca-cola' },
          { name: 'Suco de Laranja 500ml', description: 'Natural espremido na hora', price: 9.0, imageSeed: 'suco-laranja' },
          { name: 'Água Mineral 500ml', description: 'Sem gás', price: 4.0, imageSeed: 'agua-mineral' },
        ],
      },
      {
        section: 'Sobremesas',
        items: [
          { name: 'Petit Gateau', description: 'Com sorvete de creme e calda de chocolate', price: 18.0, imageSeed: 'petit-gateau' },
          { name: 'Tiramisù', description: 'Clássico italiano com mascarpone', price: 16.0, imageSeed: 'tiramisu' },
        ],
      },
    ],
  },
  {
    email: `burguer.do.ze${RESTAURANT_DOMAIN}`,
    name: 'Burguer do Zé',
    slug: 'burguer-do-ze',
    description: 'Hambúrgueres artesanais com carne angus, pão brioche e molhos exclusivos.',
    cuisine: 'Hamburguer',
    phone: '18997200002',
    address: 'Av. Palmital, 450 — Jardim Europa',
    city: 'Palmital',
    deliveryFee: 4.0,
    minOrder: 25.0,
    avgPrepMinutes: 25,
    menu: [
      {
        section: 'Burgers Clássicos',
        items: [
          { name: 'Classic Smash', description: 'Carne angus 180g, queijo cheddar, alface e tomate', price: 32.0, imageSeed: 'burger-classic' },
          { name: 'Double Smash', description: 'Dois smash burgers, cheddar duplo e molho especial', price: 44.0, imageSeed: 'burger-double' },
          { name: 'Chicken Crispy', description: 'Frango empanado crocante, maionese de alho e picles', price: 34.0, imageSeed: 'burger-chicken' },
        ],
      },
      {
        section: 'Burgers Especiais',
        items: [
          { name: 'Bacon Lovers', description: 'Angus, bacon crispy, cheddar derretido e onion rings', price: 48.0, imageSeed: 'burger-bacon' },
          { name: 'BBQ Monster', description: 'Angus 220g, molho barbecue defumado, cheddar e jalapeño', price: 52.0, imageSeed: 'burger-bbq' },
          { name: 'Veggie Zé', description: 'Burger de grão-de-bico, rúcula e cream cheese', price: 36.0, imageSeed: 'burger-veggie' },
        ],
      },
      {
        section: 'Acompanhamentos',
        items: [
          { name: 'Batata Frita Clássica', description: 'Porção individual crocante', price: 14.0, imageSeed: 'batata-frita' },
          { name: 'Onion Rings', description: 'Anéis de cebola empanados', price: 16.0, imageSeed: 'onion-rings' },
          { name: 'Batata Rústica', description: 'Com pele, temperada com ervas', price: 15.0, imageSeed: 'batata-rustica' },
        ],
      },
      {
        section: 'Bebidas',
        items: [
          { name: 'Milkshake Chocolate', description: '400ml cremoso', price: 18.0, imageSeed: 'milkshake-choc' },
          { name: 'Milkshake Morango', description: '400ml com morango fresco', price: 18.0, imageSeed: 'milkshake-morang' },
          { name: 'Refrigerante Lata', description: 'Coca, Guaraná ou Sprite', price: 7.0, imageSeed: 'refri-lata' },
        ],
      },
    ],
  },
  {
    email: `churrascaria.gaucha${RESTAURANT_DOMAIN}`,
    name: 'Churrascaria Gaúcha',
    slug: 'churrascaria-gaucha',
    description: 'Cortes nobres na brasa, espetinhos e porções para compartilhar. Tradição gaúcha em Palmital.',
    cuisine: 'Churrascaria',
    phone: '18997200003',
    address: 'Rua Sete de Setembro, 890 — Vila Nova',
    city: 'Palmital',
    deliveryFee: 6.0,
    minOrder: 40.0,
    avgPrepMinutes: 40,
    menu: [
      {
        section: 'Cortes',
        items: [
          { name: 'Picanha na Brasa', description: '300g com farofa e vinagrete', price: 72.0, imageSeed: 'picanha' },
          { name: 'Costela Gaúcha', description: 'Assada por 8h, macia e suculenta (400g)', price: 68.0, imageSeed: 'costela' },
          { name: 'Contrafilé', description: 'Grelhado ao ponto com manteiga de ervas', price: 58.0, imageSeed: 'contrafile' },
          { name: 'Fraldinha', description: 'Macia e temperada no sal grosso (280g)', price: 62.0, imageSeed: 'fraldinha' },
        ],
      },
      {
        section: 'Espetinhos',
        items: [
          { name: 'Espetinho de Carne', description: '3 espetinhos de fraldinha temperada', price: 28.0, imageSeed: 'espetinho-carne' },
          { name: 'Espetinho de Frango', description: '3 espetinhos com marinada especial', price: 24.0, imageSeed: 'espetinho-frango' },
          { name: 'Espetinho Misto', description: 'Carne, frango e linguiça (4 unid.)', price: 32.0, imageSeed: 'espetinho-misto' },
        ],
      },
      {
        section: 'Acompanhamentos',
        items: [
          { name: 'Arroz com Alho', description: 'Porção individual', price: 10.0, imageSeed: 'arroz-alho' },
          { name: 'Farofa da Casa', description: 'Com bacon e ovos', price: 12.0, imageSeed: 'farofa' },
          { name: 'Vinagrete Gaúcho', description: 'Tomate, cebola e pimentão', price: 8.0, imageSeed: 'vinagrete' },
          { name: 'Mandioca Frita', description: 'Crocante por fora, macia por dentro', price: 14.0, imageSeed: 'mandioca-frita' },
        ],
      },
      {
        section: 'Bebidas',
        items: [
          { name: 'Cerveja Artesanal 473ml', description: 'Pale Ale local', price: 18.0, imageSeed: 'cerveja-artesanal' },
          { name: 'Caipirinha de Limão', description: 'Cachaça artesanal, limão e açúcar', price: 20.0, imageSeed: 'caipirinha' },
          { name: 'Suco de Maracujá', description: '500ml natural', price: 10.0, imageSeed: 'suco-maracuja' },
        ],
      },
    ],
  },
  {
    email: `lanchonete.da.praca${RESTAURANT_DOMAIN}`,
    name: 'Lanchonete da Praça',
    slug: 'lanchonete-da-praca',
    description: 'Lanches rápidos, marmitas caseiras e café da tarde. O clássico da cidade desde 1998.',
    cuisine: 'Lanches e Marmitas',
    phone: '18997200004',
    address: 'Praça da Matriz, 15 — Centro',
    city: 'Palmital',
    deliveryFee: 3.0,
    minOrder: 20.0,
    avgPrepMinutes: 20,
    menu: [
      {
        section: 'Marmitas',
        items: [
          { name: 'Marmita Executiva', description: 'Arroz, feijão, bife acebolado, salada e suco', price: 26.0, imageSeed: 'marmita-exec' },
          { name: 'Marmita Frango', description: 'Arroz, feijão, frango grelhado ou frito, batata e salada', price: 24.0, imageSeed: 'marmita-frango' },
          { name: 'Marmita Vegana', description: 'Arroz integral, feijão, legumes refogados e salada verde', price: 22.0, imageSeed: 'marmita-vegana' },
        ],
      },
      {
        section: 'Lanches',
        items: [
          { name: 'X-Burguer', description: 'Pão, hambúrguer, queijo, alface e tomate', price: 18.0, imageSeed: 'x-burguer' },
          { name: 'X-Bacon', description: 'Com bacon e maionese da casa', price: 22.0, imageSeed: 'x-bacon' },
          { name: 'Misto Quente', description: 'Pão de forma, presunto e queijo prensado', price: 10.0, imageSeed: 'misto-quente' },
          { name: 'Cachorro Quente', description: 'Salsicha, molho de tomate e purê de batata', price: 12.0, imageSeed: 'cachorro-quente' },
        ],
      },
      {
        section: 'Café & Doces',
        items: [
          { name: 'Café com Leite', description: 'Xícara grande', price: 7.0, imageSeed: 'cafe-leite' },
          { name: 'Pão na Chapa com Manteiga', description: '2 fatias tostadas', price: 8.0, imageSeed: 'pao-chapa' },
          { name: 'Coxinha de Frango', description: 'Unidade grande', price: 6.0, imageSeed: 'coxinha' },
          { name: 'Bolo de Fubá', description: 'Fatia generosa', price: 7.0, imageSeed: 'bolo-fuba' },
        ],
      },
      {
        section: 'Bebidas',
        items: [
          { name: 'Suco Natural 400ml', description: 'Laranja, limão, abacaxi ou maracujá', price: 8.0, imageSeed: 'suco-natural' },
          { name: 'Vitamina de Banana', description: 'Banana, leite e aveia', price: 9.0, imageSeed: 'vitamina-banana' },
          { name: 'Refrigerante Lata', description: 'Diversas marcas', price: 6.0, imageSeed: 'refri-lata-lanch' },
        ],
      },
    ],
  },
];

// ─── NOTICIAS ────────────────────────────────────────────────────────────────

const newsCategories = [
  { name: 'Cidade', slug: 'cidade', color: '#3D5AFE' },
  { name: 'Política', slug: 'politica', color: '#E53935' },
  { name: 'Economia', slug: 'economia', color: '#43A047' },
  { name: 'Esportes', slug: 'esportes', color: '#FB8C00' },
  { name: 'Saúde', slug: 'saude', color: '#00ACC1' },
  { name: 'Educação', slug: 'educacao', color: '#8E24AA' },
  { name: 'Entretenimento', slug: 'entretenimento', color: '#F06292' },
  { name: 'Tecnologia', slug: 'tecnologia', color: '#546E7A' },
];

const articles = [
  {
    title: 'Novo Parque Linear é inaugurado no bairro Jardim Europa',
    slug: 'novo-parque-linear-jardim-europa',
    category: 'cidade',
    excerpt: 'Obra esperada por moradores há mais de três anos, o parque conta com pista de caminhada, academia ao ar livre e área verde preservada.',
    body: `A Prefeitura de Palmital inaugurou nesta terça-feira o tão esperado Parque Linear do Jardim Europa. Com 1,2 quilômetro de extensão às margens do Córrego do Moinho, a obra representa um investimento de R$ 4,2 milhões em qualidade de vida para os moradores da região.

O parque conta com pista de caminhada e ciclismo de 1,2 km em pavimento intertravado, academia ao ar livre com 12 aparelhos, playground infantil com brinquedos inclusivos, 340 novas árvores plantadas ao longo do percurso, iluminação em LED com painéis solares, e câmeras de segurança integradas à central municipal.

"Este parque é resultado de uma demanda antiga da população. Trabalhamos para entregar não apenas uma área de lazer, mas um pulmão verde para o bairro", declarou o prefeito durante a cerimônia de entrega.

O horário de funcionamento é das 5h às 22h todos os dias. A academia ao ar livre conta com monitores voluntários nas manhãs de sábado para orientação de exercícios.`,
    isFeatured: true,
    daysAgo: 1,
    coverSeed: 'parque-linear',
    tags: ['infraestrutura', 'lazer', 'meio-ambiente', 'jardim-europa'],
  },
  {
    title: 'Feira do Produtor bate recorde de visitantes no fim de semana',
    slug: 'feira-produtor-recorde-visitantes',
    category: 'cidade',
    excerpt: 'Mais de 3 mil pessoas passaram pela Feira do Produtor Rural neste domingo, consolidando o evento como o maior ponto de comércio local.',
    body: `A Feira do Produtor Rural de Palmital registrou neste domingo seu maior público desde a retomada pós-pandemia. Segundo a organização do evento, mais de 3 mil pessoas circularam pela Praça da Matriz entre as 6h e as 13h.

Com 87 bancas entre produtores locais, artesãos e pequenos empreendedores, a feira movimentou aproximadamente R$ 180 mil em um único dia. Os produtos mais procurados foram frutas e verduras da estação, queijos artesanais, doces caseiros e mel de abelhas sem ferrão.

A feirante Maria Aparecida, produtora de queijo colonial há 22 anos, comemorou. "Vendi tudo até as 10h. Semana que vem tenho que trazer o dobro", disse animada.

A Secretaria de Desenvolvimento Econômico informou que estuda ampliar o espaço da feira para acomodar novos produtores em lista de espera. Atualmente, 34 produtores aguardam vagas.`,
    isFeatured: false,
    daysAgo: 2,
    coverSeed: 'feira-produtor',
    tags: ['feira', 'economia-local', 'agricultura', 'turismo'],
  },
  {
    title: 'Hospital Regional recebe equipamentos de diagnóstico por imagem',
    slug: 'hospital-regional-equipamentos-diagnostico',
    category: 'saude',
    excerpt: 'Tomógrafo e aparelho de ressonância magnética chegam ao município, reduzindo espera para exames de média complexidade.',
    body: `O Hospital Regional de Palmital recebeu na última semana dois equipamentos aguardados há dois anos pelos profissionais de saúde do município: um tomógrafo de 64 canais e um aparelho de ressonância magnética de 1,5 Tesla.

Os equipamentos, adquiridos com recursos de emenda parlamentar no valor de R$ 2,8 milhões, devem reduzir de forma significativa a fila de espera para exames de diagnóstico por imagem. Atualmente, os pacientes da rede pública aguardavam em média 4 meses para realizar uma tomografia.

"Com esses equipamentos, nossa capacidade diagnóstica aumenta em três vezes. Pacientes que precisavam ser encaminhados para Assis ou Ourinhos agora serão atendidos aqui", explicou o diretor clínico do hospital.

A previsão é que os aparelhos entrem em funcionamento em até 30 dias, após a instalação e calibração pela equipe técnica do fabricante.`,
    isFeatured: true,
    daysAgo: 3,
    coverSeed: 'hospital-equipamentos',
    tags: ['saude', 'hospital', 'diagnostico', 'investimento'],
  },
  {
    title: 'Time de futsal de Palmital avança para semifinal do Campeonato Regional',
    slug: 'futsal-palmital-semifinal-regional',
    category: 'esportes',
    excerpt: 'Após vencer o Marília por 4 a 2, equipe palmitalense garante vaga na semifinal e sonha com o título inédito.',
    body: `O Palmital Futsal Club fez a festa da torcida na noite de quarta-feira ao derrotar o Marília FC por 4 a 2 no Ginásio Municipal e garantir sua vaga na semifinal do Campeonato Regional da Liga Oeste Paulista.

Os gols palmitalenses foram marcados por Kaique (2), Rodrigo e Tiago, enquanto o Marília descontou em duas oportunidades no segundo tempo. O ginásio recebeu público estimado de 800 pessoas, com ingressos esgotados desde a véspera.

O técnico Marcão destacou a evolução do time. "Trabalhamos muito taticamente essas semanas. A equipe está entrosada e confiante. Nossa meta agora é o título."

Na semifinal, o Palmital enfrentará o Assis FC no dia 15 deste mês, às 20h, em jogo único em campo neutro a ser definido pela liga. Em caso de vitória, a decisão do título será no dia 22.`,
    isFeatured: false,
    daysAgo: 2,
    coverSeed: 'futsal-palmital',
    tags: ['futsal', 'esportes', 'campeonato', 'palmital-fc'],
  },
  {
    title: 'Escola Estadual lança programa de reforço escolar gratuito nas férias',
    slug: 'escola-estadual-reforco-ferias',
    category: 'educacao',
    excerpt: 'Programa atende alunos do Ensino Fundamental II com reforço em Matemática e Português, com vagas limitadas.',
    body: `A Escola Estadual Professor Antônio José da Silva anunciou a abertura de inscrições para o Programa de Reforço Escolar de Férias, iniciativa que ocorrerá durante a primeira semana do recesso de julho.

Com 120 vagas distribuídas em quatro turmas, o programa atende estudantes do 6º ao 9º ano do Ensino Fundamental com defasagem nas disciplinas de Matemática e Língua Portuguesa. As aulas ocorrem das 8h ao meio-dia, de segunda a sexta.

"Identificamos que muitos alunos chegaram ao ano letivo com dificuldades herdadas dos anos anteriores. Este programa é uma forma de fechar essas lacunas de aprendizagem antes do segundo semestre", explica a diretora Sônia Ferreira.

As inscrições podem ser feitas presencialmente na secretaria da escola ou pelo telefone (18) 3321-4567. O prazo encerra-se na próxima sexta-feira ou quando as vagas se esgotarem.`,
    isFeatured: false,
    daysAgo: 1,
    coverSeed: 'escola-reforco',
    tags: ['educacao', 'escola', 'ferias', 'reforco-escolar'],
  },
  {
    title: 'Mercado imobiliário de Palmital cresce 18% no primeiro semestre',
    slug: 'mercado-imobiliario-cresce-primeiro-semestre',
    category: 'economia',
    excerpt: 'Registros de compra e venda no cartório local apontam crescimento expressivo puxado pela demanda por lotes em novos loteamentos.',
    body: `O mercado imobiliário de Palmital registrou crescimento de 18% no número de transações no primeiro semestre em relação ao mesmo período do ano anterior, segundo dados do Cartório de Registro de Imóveis do município.

Foram registradas 312 transações de compra, venda e financiamento entre janeiro e junho, contra 264 no mesmo período anterior. O valor total movimentado superou R$ 42 milhões, alta de 23% na comparação anual.

O crescimento é puxado principalmente pela comercialização de lotes nos dois novos loteamentos aprovados em 2024: o Residencial Palmeiras e o Jardim das Acácias. Juntos, eles colocaram 480 lotes no mercado, dos quais 70% já foram comercializados.

O consultor imobiliário local Fábio Gomes atribui o aquecimento a fatores combinados. "A taxa de juros do FGTS para financiamentos habitacionais caiu, os loteamentos novos chegaram com preços acessíveis e o município cresceu em oferta de emprego. Estamos em um ciclo positivo raro."`,
    isFeatured: true,
    daysAgo: 4,
    coverSeed: 'mercado-imobiliario',
    tags: ['economia', 'imoveis', 'crescimento', 'loteamento'],
  },
  {
    title: 'Festival Gastronômico movimenta centro histórico neste fim de semana',
    slug: 'festival-gastronomico-centro-historico',
    category: 'entretenimento',
    excerpt: 'Evento reúne 30 restaurantes e food trucks, shows ao vivo e oficinas de culinária no coração da cidade.',
    body: `O 1º Festival Gastronômico de Palmital acontece neste fim de semana, sábado e domingo, das 12h às 22h, na Praça da Matriz e arredores do centro histórico. O evento promete ser um dos maiores já realizados na cidade, reunindo 30 participantes entre restaurantes locais, food trucks, confeitarias e produtores rurais.

A programação inclui oficinas de culinária abertas ao público com chefs convidados — uma de nhoque caseiro no sábado às 15h e uma de defumação artesanal no domingo às 16h —, além de shows de música ao vivo nas noites de sábado (Trio Sertanejo Raiz, às 20h) e domingo (Jazz Instrumental Local, às 19h).

Entre os destaques gastronômicos, o evento contará com o Corredor do Queijo Artesanal, com 8 produtores da região, e o Espaço Cerveja Artesanal, com 6 marcas locais para degustação.

A entrada é gratuita. As oficinas têm inscrição prévia pelo Instagram @festgastropalmital, com 20 vagas cada.`,
    isFeatured: false,
    daysAgo: 0,
    coverSeed: 'festival-gastronomico',
    tags: ['gastronomia', 'festival', 'entretenimento', 'cultura'],
  },
  {
    title: 'Prefeitura instala Wi-Fi gratuito em 12 pontos da cidade',
    slug: 'prefeitura-wifi-gratuito-12-pontos',
    category: 'tecnologia',
    excerpt: 'Projeto de inclusão digital leva internet de alta velocidade a praças, parques e orla do Lago Municipal.',
    body: `A Prefeitura de Palmital concluiu a instalação de pontos de acesso a Wi-Fi gratuito em 12 locais públicos da cidade, incluindo a Praça da Matriz, o Parque Linear recém-inaugurado, a Orla do Lago Municipal e as principais praças dos bairros.

A rede, batizada de "PalmitalConnect", oferece conexão de 100 Mbps compartilhada, sem necessidade de cadastro para o acesso básico. Usuários que se cadastrarem com CPF têm acesso prioritário e maior velocidade, além de terem acesso a conteúdos educacionais da plataforma municipal.

"A internet hoje é um serviço essencial. Levar conectividade aos espaços públicos é uma forma concreta de democratizar o acesso à informação, ao trabalho remoto e ao estudo", afirmou o secretário municipal de Tecnologia e Inovação.

O projeto foi financiado por parceria público-privada com a operadora de telecomunicações responsável pela infraestrutura. O custo para o município é zero — em troca, a empresa tem o direito de coletar dados anônimos de uso para estudos de mobilidade urbana.`,
    isFeatured: false,
    daysAgo: 5,
    coverSeed: 'wifi-publico',
    tags: ['tecnologia', 'internet', 'inclusao-digital', 'prefeitura'],
  },
  {
    title: 'Vereadores aprovam lei que obriga presença de desfibrilador em eventos públicos',
    slug: 'lei-desfibrilador-eventos-publicos',
    category: 'politica',
    excerpt: 'Legislação aprovada por unanimidade exige equipamento e profissional treinado em eventos com mais de 200 pessoas.',
    body: `A Câmara Municipal de Palmital aprovou por unanimidade, na sessão de terça-feira, a Lei Municipal nº 2.847/2026, que torna obrigatória a presença de desfibrilador externo automático (DEA) e ao menos um profissional treinado para seu uso em eventos públicos e privados com mais de 200 participantes realizados no município.

A lei, de autoria do vereador Eduardo Mendonça (Podemos), foi inspirada em episódio ocorrido há dois anos em evento na cidade, quando um participante sofreu parada cardíaca e o socorro demorou mais de 15 minutos para chegar.

"Estatisticamente, a cada minuto sem desfibrilação, a chance de sobrevivência cai 10%. Com o equipamento no local, esse número muda radicalmente", explicou o vereador durante a votação.

Os organizadores de eventos que descumprirem a lei estarão sujeitos a multa de R$ 3.000 por infração, além de responsabilidade civil em caso de dano. A lei entra em vigor em 90 dias, dando tempo para adaptação dos organizadores.`,
    isFeatured: false,
    daysAgo: 3,
    coverSeed: 'camara-vereadores',
    tags: ['politica', 'saude', 'camara-municipal', 'legislacao'],
  },
];

// ─── EMPRESA EXTRA: mais produtos para empresas existentes ────────────────────

const extraProducts: Record<string, Array<{
  name: string; description: string; price: number;
  category: string; productType: ProductType; isFeatured: boolean;
  promoPrice?: number; stock?: number;
}>> = {
  'boutique-moda': [
    { name: 'Vestido Midi Floral', description: 'Tecido viscose com estampa exclusiva, tamanhos P ao GG', price: 189.90, category: 'Vestidos', productType: 'FIXED', isFeatured: true },
    { name: 'Calça Jeans Wide Leg', description: 'Modelagem wide, cintura alta, lavagem clara', price: 159.90, category: 'Calças', productType: 'FIXED', isFeatured: false },
    { name: 'Blusa Cropped Linho', description: 'Leve e fresca, ideal para o verão', price: 79.90, category: 'Blusas', productType: 'FIXED', isFeatured: false },
    { name: 'Conjunto Shorts + Blusa', description: 'Conjunto a combinar, várias cores', price: 139.90, category: 'Conjuntos', productType: 'PROMO', isFeatured: true, promoPrice: 99.90, stock: 8 },
    { name: 'Bolsa de Couro Sintético', description: 'Grande, com alça ajustável e zíper', price: 119.90, category: 'Acessórios', productType: 'FIXED', isFeatured: false },
    { name: 'Sandália Plataforma', description: 'Salto 5cm, fechamento em tiras', price: 129.90, category: 'Calçados', productType: 'FIXED', isFeatured: false },
    { name: 'Cinto Transspassado', description: 'Couro legítimo, tamanho único ajustável', price: 49.90, category: 'Acessórios', productType: 'PROMO', isFeatured: false, promoPrice: 34.90, stock: 15 },
  ],
  'padaria-central': [
    { name: 'Pão Francês (unid.)', description: 'Fresquinho, saindo do forno a cada 2h', price: 0.90, category: 'Pães', productType: 'FIXED', isFeatured: false },
    { name: 'Pão de Forma Integral', description: 'Fatias macias, embalagem de 500g', price: 11.90, category: 'Pães', productType: 'FIXED', isFeatured: false },
    { name: 'Bolo de Chocolate Trufado', description: 'Recheio de ganache e cobertura de chocolate belga', price: 68.00, category: 'Bolos', productType: 'FIXED', isFeatured: true },
    { name: 'Bolo de Cenoura com Brigadeiro', description: 'Clássico, fatias de 200g ou bolo inteiro', price: 58.00, category: 'Bolos', productType: 'FIXED', isFeatured: false },
    { name: 'Croissant de Presunto e Queijo', description: 'Manteiga importada, massa folhada artesanal', price: 8.90, category: 'Salgados', productType: 'FIXED', isFeatured: true },
    { name: 'Sonho de Creme', description: 'Recheado com creme de baunilha, polvilhado', price: 5.50, category: 'Doces', productType: 'FIXED', isFeatured: false },
    { name: 'Cesta Café da Manhã', description: 'Para 2 pessoas: pães, frios, geleia, bolo e suco', price: 89.90, category: 'Cestas', productType: 'PROMO', isFeatured: true, promoPrice: 74.90, stock: 5 },
    { name: 'Rosca de Coco', description: 'Doce, polvilhada com açúcar e coco ralado', price: 22.00, category: 'Doces', productType: 'FIXED', isFeatured: false },
  ],
  'farmacia-saude': [
    { name: 'Vitamina C 1000mg (60 cáps)', description: 'Efervescente ou comprimido, imunidade garantida', price: 42.90, category: 'Vitaminas', productType: 'FIXED', isFeatured: true },
    { name: 'Protetor Solar FPS 50+ 200ml', description: 'Toque seco, sem oleosidade, para rosto e corpo', price: 49.90, category: 'Dermocosméticos', productType: 'PROMO', isFeatured: true, promoPrice: 37.90, stock: 20 },
    { name: 'Termômetro Digital', description: 'Leitura em 10 segundos, beep de alarme', price: 29.90, category: 'Equipamentos', productType: 'FIXED', isFeatured: false },
    { name: 'Dipirona 500mg (20 cáps)', description: 'Analgésico e antitérmico', price: 8.90, category: 'Medicamentos', productType: 'FIXED', isFeatured: false },
    { name: 'Colágeno Hidrolisado 300g', description: 'Em pó, neutro, se dissolve em qualquer líquido', price: 68.90, category: 'Suplementos', productType: 'FIXED', isFeatured: false },
    { name: 'Kit Primeiros Socorros', description: 'Gazes, esparadrapo, álcool gel e tesoura', price: 39.90, category: 'Primeiros Socorros', productType: 'FIXED', isFeatured: false },
    { name: 'Repelente em Spray 100ml', description: 'Eficaz por até 8h, fórmula DEET 15%', price: 24.90, category: 'Higiene', productType: 'PROMO', isFeatured: false, promoPrice: 18.90, stock: 30 },
  ],
};

// ─── FUNÇÕES ──────────────────────────────────────────────────────────────────

async function seedRestaurants(testPassword: string) {
  const restaurantMap: Map<string, { id: string; menu: Map<string, string> }> = new Map();

  for (const r of restaurants) {
    const hash = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        passwordHash: hash,
        phone: `+55${r.phone}`,
        role: UserRole.RESTAURANT_OWNER,
        profile: {
          create: {
            displayName: r.name,
            username: r.slug.replace(/-/g, '_'),
            city: r.city,
            bio: r.description,
            avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(r.name)}`,
          },
        },
      },
    });

    const restaurant = await prisma.restaurant.upsert({
      where: { slug: r.slug },
      update: { isOpen: true },
      create: {
        ownerId: user.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        cuisine: r.cuisine,
        phone: r.phone,
        address: r.address,
        city: r.city,
        deliveryFee: r.deliveryFee,
        minOrder: r.minOrder,
        avgPrepMinutes: r.avgPrepMinutes,
        isOpen: true,
        isVerified: true,
        ratingAvg: 4.3 + Math.random() * 0.6,
        ratingCount: 12 + Math.floor(Math.random() * 80),
        logoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(r.name)}`,
        coverUrl: imageUrl(`restaurant-${r.slug}`, 1200, 400),
      },
    });

    const itemMap: Map<string, string> = new Map();
    let sectionOrder = 0;

    for (const section of r.menu) {
      const sec = await prisma.menuSection.create({
        data: {
          restaurantId: restaurant.id,
          name: section.section,
          sortOrder: sectionOrder++,
        },
      });

      let itemOrder = 0;
      for (const item of section.items) {
        const mi = await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            sectionId: sec.id,
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: imageUrl(item.imageSeed, 600, 400),
            isAvailable: true,
            sortOrder: itemOrder++,
          },
        });
        itemMap.set(item.name, mi.id);
      }
    }

    restaurantMap.set(r.slug, { id: restaurant.id, menu: itemMap });
  }

  return restaurantMap;
}

async function seedDeliveryOrders(
  restaurantMap: Map<string, { id: string; menu: Map<string, string> }>,
  customerIds: string[],
) {
  const orderScenarios = [
    {
      restaurantSlug: 'bella-napoli',
      orders: [
        { items: [{ name: 'Margherita', qty: 1 }, { name: 'Coca-Cola 2L', qty: 1 }], status: OrderStatus.DELIVERED, daysBack: 3 },
        { items: [{ name: 'Quatro Queijos', qty: 1 }, { name: 'Petit Gateau', qty: 2 }], status: OrderStatus.PREPARING, daysBack: 0 },
        { items: [{ name: 'Calabresa', qty: 2 }, { name: 'Suco de Laranja 500ml', qty: 2 }], status: OrderStatus.DELIVERED, daysBack: 7 },
        { items: [{ name: 'Frango com Catupiry', qty: 1 }], status: OrderStatus.PENDING, daysBack: 0 },
      ],
    },
    {
      restaurantSlug: 'burguer-do-ze',
      orders: [
        { items: [{ name: 'Double Smash', qty: 2 }, { name: 'Batata Frita Clássica', qty: 2 }], status: OrderStatus.DELIVERED, daysBack: 1 },
        { items: [{ name: 'Bacon Lovers', qty: 1 }, { name: 'Milkshake Chocolate', qty: 1 }], status: OrderStatus.ON_THE_WAY, daysBack: 0 },
        { items: [{ name: 'Chicken Crispy', qty: 1 }, { name: 'Onion Rings', qty: 1 }, { name: 'Refrigerante Lata', qty: 2 }], status: OrderStatus.DELIVERED, daysBack: 5 },
        { items: [{ name: 'BBQ Monster', qty: 1 }, { name: 'Batata Rústica', qty: 1 }], status: OrderStatus.ACCEPTED, daysBack: 0 },
      ],
    },
    {
      restaurantSlug: 'churrascaria-gaucha',
      orders: [
        { items: [{ name: 'Picanha na Brasa', qty: 1 }, { name: 'Farofa da Casa', qty: 1 }, { name: 'Caipirinha de Limão', qty: 2 }], status: OrderStatus.DELIVERED, daysBack: 4 },
        { items: [{ name: 'Costela Gaúcha', qty: 1 }, { name: 'Mandioca Frita', qty: 1 }], status: OrderStatus.DELIVERED, daysBack: 10 },
        { items: [{ name: 'Espetinho Misto', qty: 3 }, { name: 'Arroz com Alho', qty: 2 }], status: OrderStatus.PREPARING, daysBack: 0 },
      ],
    },
    {
      restaurantSlug: 'lanchonete-da-praca',
      orders: [
        { items: [{ name: 'Marmita Executiva', qty: 2 }, { name: 'Suco Natural 400ml', qty: 2 }], status: OrderStatus.DELIVERED, daysBack: 2 },
        { items: [{ name: 'X-Bacon', qty: 1 }, { name: 'Batata Frita Clássica', qty: 1 }], status: OrderStatus.DELIVERED, daysBack: 6 },
        { items: [{ name: 'Coxinha de Frango', qty: 4 }, { name: 'Café com Leite', qty: 2 }], status: OrderStatus.PENDING, daysBack: 0 },
        { items: [{ name: 'Marmita Vegana', qty: 1 }, { name: 'Vitamina de Banana', qty: 1 }], status: OrderStatus.DELIVERED, daysBack: 1 },
      ],
    },
  ];

  for (const scenario of orderScenarios) {
    const rest = restaurantMap.get(scenario.restaurantSlug);
    if (!rest) continue;

    for (let i = 0; i < scenario.orders.length; i++) {
      const o = scenario.orders[i];
      const customerId = customerIds[i % customerIds.length];
      const createdAt = daysAgo(o.daysBack);

      let subtotal = 0;
      const itemsData = [];

      for (const oi of o.items) {
        // Find price from menu definition
        const menuItem = restaurants
          .find(r => r.slug === scenario.restaurantSlug)
          ?.menu.flatMap(s => s.items)
          .find(item => item.name === oi.name);

        if (!menuItem) continue;
        const menuItemId = rest.menu.get(oi.name);
        const lineTotal = menuItem.price * oi.qty;
        subtotal += lineTotal;
        itemsData.push({ name: oi.name, price: menuItem.price, qty: oi.qty, menuItemId });
      }

      const restDef = restaurants.find(r => r.slug === scenario.restaurantSlug)!;
      const deliveryFee = restDef.deliveryFee;
      const total = subtotal + deliveryFee;

      await prisma.order.create({
        data: {
          restaurantId: rest.id,
          customerId,
          type: OrderType.DELIVERY,
          status: o.status,
          subtotal,
          deliveryFee,
          total,
          deliveryAddress: 'Rua das Palmeiras, 123 — Palmital',
          paymentMethod: 'PIX_MANUAL',
          createdAt,
          updatedAt: createdAt,
          acceptedAt: o.status !== OrderStatus.PENDING ? createdAt : null,
          deliveredAt: o.status === OrderStatus.DELIVERED ? new Date(createdAt.getTime() + 45 * 60000) : null,
          items: {
            create: itemsData.map(item => ({
              menuItemId: item.menuItemId ?? null,
              name: item.name,
              price: item.price,
              quantity: item.qty,
            })),
          },
        },
      });
    }
  }
}

async function seedNewsArticles(testPassword: string) {
  // Criar categorias de notícias
  const catMap: Map<string, string> = new Map();
  for (let i = 0; i < newsCategories.length; i++) {
    const cat = await prisma.articleCategory.upsert({
      where: { slug: newsCategories[i].slug },
      update: {},
      create: {
        name: newsCategories[i].name,
        slug: newsCategories[i].slug,
        color: newsCategories[i].color,
        sortOrder: i,
      },
    });
    catMap.set(newsCategories[i].slug, cat.id);
  }

  // Criar jornalistas
  const journalists = [
    { email: `jornalista.pedro${RESTAURANT_DOMAIN}`, name: 'Pedro Amaral', username: 'pedro_amaral' },
    { email: `jornalista.lucia${RESTAURANT_DOMAIN}`, name: 'Lúcia Campos', username: 'lucia_campos' },
  ];

  const journalistIds: string[] = [];
  for (const j of journalists) {
    const hash = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.upsert({
      where: { email: j.email },
      update: {},
      create: {
        email: j.email,
        passwordHash: hash,
        phone: `+5518997${Math.floor(300000 + Math.random() * 99999)}`,
        role: UserRole.JOURNALIST,
        profile: {
          create: {
            displayName: j.name,
            username: j.username,
            city: 'Palmital',
            bio: `Jornalista local cobrindo as principais notícias de Palmital e região.`,
            avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(j.name)}`,
          },
        },
      },
    });
    journalistIds.push(user.id);
  }

  // Criar artigos
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const catId = catMap.get(a.category);
    const authorId = journalistIds[i % journalistIds.length];
    const publishedAt = daysAgo(a.daysAgo);

    const existing = await prisma.article.findUnique({ where: { slug: a.slug } });
    if (existing) continue;

    await prisma.article.create({
      data: {
        authorId,
        categoryId: catId ?? null,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        body: a.body,
        coverUrl: imageUrl(a.coverSeed, 1200, 600),
        tags: a.tags,
        status: ArticleStatus.PUBLISHED,
        isFeatured: a.isFeatured,
        views: 50 + Math.floor(Math.random() * 800),
        publishedAt,
        createdAt: publishedAt,
        updatedAt: publishedAt,
      },
    });
  }
}

async function seedExtraProducts(companiesBySlug: Map<string, { id: string }>) {
  for (const [slug, products] of Object.entries(extraProducts)) {
    const company = companiesBySlug.get(slug);
    if (!company) continue;

    // Atualizar empresa para modo CART ou BOTH
    await prisma.company.update({
      where: { id: company.id },
      data: { sellMode: StoreSellMode.BOTH, whatsapp: `1899710${Math.floor(1000 + Math.random() * 8999)}` },
    });

    for (const p of products) {
      const promoEndsAt = p.productType === 'PROMO'
        ? new Date(Date.now() + 7 * 86_400_000)
        : null;

      await prisma.product.create({
        data: {
          companyId: company.id,
          name: p.name,
          description: p.description,
          price: p.price,
          promoPrice: p.promoPrice ?? null,
          stock: p.stock ?? null,
          category: p.category,
          productType: p.productType,
          isFeatured: p.isFeatured,
          isAvailable: true,
          promoEndsAt,
          imageUrl: imageUrl(`product-${slug}-${p.name}`, 600, 600),
        },
      });
    }
  }
}

async function seedCompanyOrders(
  companiesBySlug: Map<string, { id: string }>,
  customerIds: string[],
) {
  for (const [slug, company] of companiesBySlug.entries()) {
    const products = await prisma.product.findMany({
      where: { companyId: company.id, isAvailable: true },
      take: 4,
    });
    if (products.length < 2) continue;

    const statuses = [
      CompanyOrderStatus.COMPLETED,
      CompanyOrderStatus.PENDING,
      CompanyOrderStatus.COMPLETED,
      CompanyOrderStatus.ACCEPTED,
    ];

    for (let i = 0; i < Math.min(statuses.length, 2 + (customerIds.length % 3)); i++) {
      const p1 = products[i % products.length];
      const p2 = products[(i + 1) % products.length];
      const qty1 = 1 + (i % 2);
      const qty2 = 1;
      const subtotal = Number(p1.price ?? 0) * qty1 + Number(p2.price ?? 0) * qty2;
      const customerId = customerIds[i % customerIds.length];
      const createdAt = daysAgo(i * 3 + 1);

      await prisma.companyOrder.create({
        data: {
          companyId: company.id,
          customerId,
          status: statuses[i],
          subtotal,
          total: subtotal,
          customerName: `Cliente Teste ${i + 1}`,
          customerPhone: `1899710000${i}`,
          paymentMethod: i % 2 === 0 ? 'PIX_MANUAL' : 'WHATSAPP',
          createdAt,
          updatedAt: createdAt,
          acceptedAt: statuses[i] !== CompanyOrderStatus.PENDING ? createdAt : null,
          completedAt: statuses[i] === CompanyOrderStatus.COMPLETED ? new Date(createdAt.getTime() + 30 * 60000) : null,
          items: {
            create: [
              { productId: p1.id, name: p1.name, price: p1.price ?? 0, quantity: qty1 },
              { productId: p2.id, name: p2.name, price: p2.price ?? 0, quantity: qty2 },
            ],
          },
        },
      });
    }
  }
}

export async function runExtraSeeds(
  testPassword: string,
  companiesBySlug: Map<string, { id: string }>,
  customerIds: string[],
  prismaInstance: PrismaClient,
) {
  prisma = prismaInstance;
  console.log('\nRunning extra seeds: delivery, news, products, orders...');

  const restaurantMap = await seedRestaurants(testPassword);
  console.log(`Restaurants: ${restaurantMap.size}`);

  await seedDeliveryOrders(restaurantMap, customerIds);
  console.log(`Delivery orders: seeded`);

  await seedNewsArticles(testPassword);
  console.log(`News articles: ${articles.length}`);

  await seedExtraProducts(companiesBySlug);
  console.log(`Extra products: seeded for boutique-moda, padaria-central, farmacia-saude`);

  await seedCompanyOrders(companiesBySlug, customerIds);
  console.log(`Company orders: seeded`);
}
