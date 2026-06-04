import {
  ClassifiedStatus,
  MediaType,
  MessageStatus,
  PostReactionType,
  PostType,
  PromotionKind,
  PrismaClient,
  UserRole,
} from '../generated/prisma';
import { runExtraSeeds } from './seed-extra';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@palmital.digital';
const TEST_DOMAIN = '@palmital.test';

type CategorySeed = {
  name: string;
  slug: string;
  iconName: string;
  children?: CategorySeed[];
};

type UserSeed = {
  email: string;
  phone: string;
  displayName: string;
  username: string;
  city: string;
  bio: string;
  avatarSeed: string;
  coverSeed: string;
};

type ProductSeed = {
  name: string;
  description: string;
  price?: number;
  imageSeed: string;
  isAvailable?: boolean;
};

type BusinessUserSeed = UserSeed & {
  company: {
    name: string;
    slug: string;
    description: string;
    phone: string;
    address: string;
    city: string;
    category: string;
    isVerified: boolean;
    coverSeed: string;
    products: ProductSeed[];
  };
};

type PostSeed = {
  authorEmail: string;
  content: string;
  createdAt: Date;
  mediaSeeds?: string[];
};

type BusinessPostSeed = PostSeed & {
  companySlug: string;
};

type ClassifiedItemSeed = {
  title: string;
  description: string;
  price?: number;
  isFree?: boolean;
};

type PromotionSeed = {
  authorEmail: string;
  createdAt: Date;
  content: string;
  kind: PromotionKind;
  headline: string;
  subtitle?: string;
  city?: string;
  serviceArea?: string;
  highlights: string[];
} & (
  | {
      kind: 'PROFESSIONAL';
    }
  | {
      kind: 'COMPANY_PROFILE' | 'COMPANY_PRODUCTS';
      companySlug: string;
      productNames?: string[];
    }
);

type ConversationSeed = {
  participants: [string, string];
  messages: Array<{
    senderEmail: string;
    content: string;
    status: MessageStatus;
    createdAt: Date;
  }>;
  lastReadAt?: Record<string, Date | null>;
};

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

function imageUrl(seed: string, width = 1200, height = 1200) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

function hoursAgo(hours: number) {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() - hours);
  return date;
}

const categoryTree: CategorySeed[] = [
  {
    name: 'Agro e Animais',
    slug: 'agro-e-animais',
    iconName: 'leaf',
    children: [
      { name: 'Animais de Fazenda', slug: 'animais-de-fazenda', iconName: 'paw' },
      { name: 'Pet Shop', slug: 'pet-shop', iconName: 'bone' },
      { name: 'Equipamentos Rurais', slug: 'equipamentos-rurais', iconName: 'tractor' },
    ],
  },
  {
    name: 'Veiculos',
    slug: 'veiculos',
    iconName: 'car',
    children: [
      { name: 'Carros', slug: 'carros', iconName: 'car-front' },
      { name: 'Motos', slug: 'motos', iconName: 'bike' },
      { name: 'Pecas e Acessorios', slug: 'pecas-e-acessorios', iconName: 'settings-2' },
    ],
  },
  {
    name: 'Imoveis',
    slug: 'imoveis',
    iconName: 'home',
    children: [
      { name: 'Casas', slug: 'casas', iconName: 'house' },
      { name: 'Terrenos', slug: 'terrenos', iconName: 'map' },
      { name: 'Comercial', slug: 'comercial', iconName: 'building-2' },
    ],
  },
  {
    name: 'Eletronicos',
    slug: 'eletronicos',
    iconName: 'smartphone',
    children: [
      { name: 'Celulares', slug: 'celulares', iconName: 'smartphone' },
      { name: 'Informatica', slug: 'informatica', iconName: 'laptop' },
      { name: 'Games', slug: 'games', iconName: 'gamepad-2' },
    ],
  },
  {
    name: 'Casa e Estilo',
    slug: 'casa-e-estilo',
    iconName: 'sofa',
    children: [
      { name: 'Moveis', slug: 'moveis', iconName: 'armchair' },
      { name: 'Decoracao', slug: 'decoracao', iconName: 'lamp' },
      { name: 'Moda', slug: 'moda', iconName: 'shirt' },
    ],
  },
  {
    name: 'Servicos',
    slug: 'servicos',
    iconName: 'wrench',
    children: [
      { name: 'Fretes', slug: 'fretes', iconName: 'truck' },
      { name: 'Reformas', slug: 'reformas', iconName: 'hammer' },
      { name: 'Aulas e Consultoria', slug: 'aulas-e-consultoria', iconName: 'graduation-cap' },
    ],
  },
];

const regularUsers: UserSeed[] = [
  {
    email: 'ana.souza@palmital.test',
    phone: '+5518997100001',
    displayName: 'Ana Souza',
    username: 'ana_souza',
    city: 'Palmital',
    bio: 'Fotografa de eventos e sempre de olho nas novidades da cidade.',
    avatarSeed: 'Ana Souza',
    coverSeed: 'Ana Souza cover',
  },
  {
    email: 'bruno.lima@palmital.test',
    phone: '+5518997100002',
    displayName: 'Bruno Lima',
    username: 'bruno_lima',
    city: 'Assis',
    bio: 'Engenheiro agronomo, ciclista e comprador compulsivo de ferramentas.',
    avatarSeed: 'Bruno Lima',
    coverSeed: 'Bruno Lima cover',
  },
  {
    email: 'carla.fernandes@palmital.test',
    phone: '+5518997100003',
    displayName: 'Carla Fernandes',
    username: 'carla_fernandes',
    city: 'Palmital',
    bio: 'Professora, mae de dois filhos e usuaria ativa dos classificados.',
    avatarSeed: 'Carla Fernandes',
    coverSeed: 'Carla Fernandes cover',
  },
  {
    email: 'diego.alves@palmital.test',
    phone: '+5518997100004',
    displayName: 'Diego Alves',
    username: 'diego_alves',
    city: 'Candido Mota',
    bio: 'Mecanico e apaixonado por carros antigos e projetos DIY.',
    avatarSeed: 'Diego Alves',
    coverSeed: 'Diego Alves cover',
  },
  {
    email: 'elisa.moraes@palmital.test',
    phone: '+5518997100005',
    displayName: 'Elisa Moraes',
    username: 'elisa_moraes',
    city: 'Ourinhos',
    bio: 'Arquiteta que usa a plataforma para acompanhar negocios e imoveis.',
    avatarSeed: 'Elisa Moraes',
    coverSeed: 'Elisa Moraes cover',
  },
  {
    email: 'fabio.gomes@palmital.test',
    phone: '+5518997100006',
    displayName: 'Fabio Gomes',
    username: 'fabio_gomes',
    city: 'Palmital',
    bio: 'Servidor publico, corredor de rua e cliente fiel do comercio local.',
    avatarSeed: 'Fabio Gomes',
    coverSeed: 'Fabio Gomes cover',
  },
  {
    email: 'gabriela.rocha@palmital.test',
    phone: '+5518997100007',
    displayName: 'Gabriela Rocha',
    username: 'gabriela_rocha',
    city: 'Maracai',
    bio: 'Veterinaria com foco em pequenos animais e conteudo educativo.',
    avatarSeed: 'Gabriela Rocha',
    coverSeed: 'Gabriela Rocha cover',
  },
  {
    email: 'henrique.nunes@palmital.test',
    phone: '+5518997100008',
    displayName: 'Henrique Nunes',
    username: 'henrique_nunes',
    city: 'Salto Grande',
    bio: 'Tecnico em informatica e vendedor de eletronicos revisados.',
    avatarSeed: 'Henrique Nunes',
    coverSeed: 'Henrique Nunes cover',
  },
  {
    email: 'leonardo.ferrari@palmital.test',
    phone: '+5518997100009',
    displayName: 'Leonardo Ferrari',
    username: 'leo_eletricista',
    city: 'Palmital',
    bio: 'Eletricista residencial com foco em padrao, chuveiro, manutencao e atendimento rapido.',
    avatarSeed: 'Leonardo Ferrari',
    coverSeed: 'Leonardo Ferrari cover',
  },
  {
    email: 'patricia.azevedo@palmital.test',
    phone: '+5518997100010',
    displayName: 'Patricia Azevedo',
    username: 'paty_pintura',
    city: 'Ourinhos',
    bio: 'Pintora residencial e comercial, acabamento fino e combinacao de cores.',
    avatarSeed: 'Patricia Azevedo',
    coverSeed: 'Patricia Azevedo cover',
  },
];

const businessUsers: BusinessUserSeed[] = [
  {
    email: 'boutique.moda@palmital.test',
    phone: '+5518997100020',
    displayName: 'Fernanda Costa',
    username: 'fernanda_boutique',
    city: 'Palmital',
    bio: 'Apaixonada por moda feminina e por ajudar as mulheres da cidade a se vestirem bem.',
    avatarSeed: 'Fernanda Costa',
    coverSeed: 'Boutique Vic cover',
    company: {
      name: 'Boutique Vic',
      slug: 'boutique-vic',
      description: 'Moda feminina contemporânea com peças exclusivas e preços acessíveis para a mulher de Palmital.',
      phone: '(18) 3351-4455',
      address: 'Rua Saldanha Marinho, 180',
      city: 'Palmital',
      category: 'Moda',
      isVerified: true,
      coverSeed: 'Boutique Vic cover',
      products: [
        {
          name: 'Vestido Midi Floral',
          description: 'Tecido leve, estampa exclusiva. Tamanhos P ao GG.',
          price: 129.9,
          imageSeed: 'vestido-midi-floral',
          isAvailable: true,
        },
        {
          name: 'Conjunto Linho Bege',
          description: 'Calça + blusa, lavável e com caimento perfeito.',
          price: 179.9,
          imageSeed: 'conjunto-linho-bege',
          isAvailable: true,
        },
        {
          name: 'Bolsa Couro Caramelo',
          description: 'Couro legítimo, alça regulável e compartimento interno.',
          price: 239.0,
          imageSeed: 'bolsa-couro-caramelo',
          isAvailable: true,
        },
        {
          name: 'Sandália Flatform Nude',
          description: 'Salto de 4cm, solado antiderrapante. Nºs 34 ao 40.',
          price: 98.9,
          imageSeed: 'sandalia-flatform-nude',
          isAvailable: true,
        },
        {
          name: 'Blusa Cropped Rib',
          description: 'Diversas cores, tecido elástico e modelagem slim.',
          price: 59.9,
          imageSeed: 'blusa-cropped-rib',
          isAvailable: true,
        },
      ],
    },
  },
  {
    email: 'padaria.central@palmital.test',
    phone: '+5518997100021',
    displayName: 'Carlos Padeiro',
    username: 'carlos_padaria',
    city: 'Palmital',
    bio: 'Padeiro há 22 anos, acordando cedo para deixar o pão quentinho na mesa de Palmital.',
    avatarSeed: 'Carlos Padeiro',
    coverSeed: 'Padaria Central cover',
    company: {
      name: 'Padaria Central Palmital',
      slug: 'padaria-central-palmital',
      description: 'Pão fresquinho, bolos artesanais e salgados desde as 5h da manhã. Entregamos no centro.',
      phone: '(18) 3351-1234',
      address: 'Rua XV de Novembro, 87',
      city: 'Palmital',
      category: 'Alimentação',
      isVerified: true,
      coverSeed: 'Padaria Central cover',
      products: [
        {
          name: 'Pão Francês (dúzia)',
          description: 'Assado de hora em hora. Crocante por fora, macio por dentro.',
          price: 8.9,
          imageSeed: 'pao-frances-duzia',
          isAvailable: true,
        },
        {
          name: 'Bolo de Cenoura com Cobertura',
          description: 'Receita tradicional, cobertura de chocolate belga.',
          price: 34.9,
          imageSeed: 'bolo-cenoura-cobertura',
          isAvailable: true,
        },
        {
          name: 'Coxinha de Frango (10 un)',
          description: 'Massa crocante, recheio cremoso. Ideal para festas.',
          price: 29.9,
          imageSeed: 'coxinha-frango-10un',
          isAvailable: true,
        },
        {
          name: 'Café da Manhã Completo',
          description: 'Pão, manteiga, queijo, frios e suco. Porção para 2.',
          price: 42.0,
          imageSeed: 'cafe-manha-completo',
          isAvailable: true,
        },
        {
          name: 'Encomenda de Bolo Decorado',
          description: 'Tema personalizado, encomende com 3 dias de antecedência.',
          price: 120.0,
          imageSeed: 'bolo-decorado-encomenda',
          isAvailable: true,
        },
      ],
    },
  },
  {
    email: 'farmacia.saude@palmital.test',
    phone: '+5518997100022',
    displayName: 'Dra. Beatriz Farmácia',
    username: 'beatriz_farmacia',
    city: 'Palmital',
    bio: 'Farmacêutica comprometida com o bem-estar da comunidade de Palmital.',
    avatarSeed: 'Beatriz Farmacia',
    coverSeed: 'Farmacia Saude cover',
    company: {
      name: 'Farmácia Saúde & Vida',
      slug: 'farmacia-saude-vida',
      description: 'Medicamentos, dermocosméticos e produtos de bem-estar com atendimento farmacêutico gratuito.',
      phone: '(18) 3351-8899',
      address: 'Avenida Brasil, 520',
      city: 'Palmital',
      category: 'Saúde',
      isVerified: true,
      coverSeed: 'Farmacia Saude cover',
      products: [
        {
          name: 'Protetor Solar FPS 50+',
          description: 'Textura leve, resistente à água. 200ml.',
          price: 34.9,
          imageSeed: 'protetor-solar-fps50',
          isAvailable: true,
        },
        {
          name: 'Vitamina C 1000mg (30 cp)',
          description: 'Importada, efervescente. Apoia a imunidade.',
          price: 28.9,
          imageSeed: 'vitamina-c-1000mg',
          isAvailable: true,
        },
        {
          name: 'Sérum Anti-Idade Vitamina A',
          description: 'Retinol 0,3%. Uso noturno. Resultados em 4 semanas.',
          price: 89.0,
          imageSeed: 'serum-anti-idade-retinol',
          isAvailable: true,
        },
        {
          name: 'Colágeno Hidrolisado (300g)',
          description: 'Sem sabor, dissolve fácil em qualquer líquido.',
          price: 54.9,
          imageSeed: 'colageno-hidrolisado-300g',
          isAvailable: true,
        },
        {
          name: 'Kit Cuidado Facial Completo',
          description: 'Sabonete + tônico + hidratante da linha Dermage.',
          price: 149.0,
          imageSeed: 'kit-cuidado-facial',
          isAvailable: true,
        },
      ],
    },
  },
  {
    email: 'mariana.silva@palmital.test',
    phone: '+5518997100011',
    displayName: 'Mariana Silva',
    username: 'mariana_silva',
    city: 'Palmital',
    bio: 'Produtora rural e proprietaria da Casa do Campo Palmital.',
    avatarSeed: 'Mariana Silva',
    coverSeed: 'Mariana Silva cover',
    company: {
      name: 'Casa do Campo Palmital',
      slug: 'casa-do-campo-palmital',
      description: 'Loja com foco em nutricao animal, insumos rurais e atendimento tecnico.',
      phone: '(18) 3351-1001',
      address: 'Rua Sete de Setembro, 245',
      city: 'Palmital',
      category: 'Agro e Pet',
      isVerified: true,
      coverSeed: 'Casa do Campo Palmital',
      products: [
        {
          name: 'Racao Premium 25kg',
          description: 'Formula balanceada para caes adultos de medio porte.',
          price: 169.9,
          imageSeed: 'racao-premium-25kg',
        },
        {
          name: 'Semente de Milho Hibrido',
          description: 'Saca com alto vigor e excelente germinacao.',
          price: 138.5,
          imageSeed: 'semente-milho-hibrido',
        },
        {
          name: 'Mineral Bovino 30kg',
          description: 'Suplemento mineral para rebanho de corte e leite.',
          price: 94.9,
          imageSeed: 'mineral-bovino-30kg',
        },
        {
          name: 'Pulverizador Costal 20L',
          description: 'Equipamento reforcado para aplicacao em pequenas areas.',
          price: 289.0,
          imageSeed: 'pulverizador-costal-20l',
        },
      ],
    },
  },
  {
    email: 'ricardo.melo@palmital.test',
    phone: '+5518997100012',
    displayName: 'Ricardo Melo',
    username: 'ricardo_melo',
    city: 'Palmital',
    bio: 'Comerciante do setor automotivo e comprador de seminovos.',
    avatarSeed: 'Ricardo Melo',
    coverSeed: 'Ricardo Melo cover',
    company: {
      name: 'Auto Prime Palmital',
      slug: 'auto-prime-palmital',
      description: 'Loja de seminovos com revisao, consignacao e apoio na documentacao.',
      phone: '(18) 3351-2040',
      address: 'Avenida Reginalda Leao, 810',
      city: 'Palmital',
      category: 'Veiculos',
      isVerified: true,
      coverSeed: 'Auto Prime Palmital',
      products: [
        {
          name: 'Chevrolet Onix LT 2021',
          description: 'Automatico, baixa km e todas as revisoes registradas.',
          price: 68900,
          imageSeed: 'chevrolet-onix-lt-2021',
        },
        {
          name: 'Honda CG 160 Fan 2022',
          description: 'Moto economica, pneus novos e documentacao ok.',
          price: 14800,
          imageSeed: 'honda-cg-160-fan-2022',
        },
        {
          name: 'Scanner Automotivo OBD2',
          description: 'Leitura basica de falhas com aplicativo compativel.',
          price: 289.9,
          imageSeed: 'scanner-obd2',
        },
        {
          name: 'Multimidia 9 polegadas',
          description: 'Tela touch, camera de re e conexao Android Auto.',
          price: 1190,
          imageSeed: 'multimidia-9-polegadas',
        },
      ],
    },
  },
  {
    email: 'juliana.ribeiro@palmital.test',
    phone: '+5518997100013',
    displayName: 'Juliana Ribeiro',
    username: 'juliana_ribeiro',
    city: 'Candido Mota',
    bio: 'Empreendedora criativa e curadora de presentes artesanais.',
    avatarSeed: 'Juliana Ribeiro',
    coverSeed: 'Juliana Ribeiro cover',
    company: {
      name: 'Atelier Flor de Cafe',
      slug: 'atelier-flor-de-cafe',
      description: 'Presentes autorais, cestas sazonais e kits para datas especiais.',
      phone: '(18) 3341-1188',
      address: 'Rua Rio de Janeiro, 52',
      city: 'Candido Mota',
      category: 'Presentes e Cafes',
      isVerified: false,
      coverSeed: 'Atelier Flor de Cafe',
      products: [
        {
          name: 'Cesta Cafe da Tarde',
          description: 'Biscoitos artesanais, cafe especial e geleia caseira.',
          price: 89.9,
          imageSeed: 'cesta-cafe-da-tarde',
        },
        {
          name: 'Kit Presente Aromas',
          description: 'Vela, sabonete liquido e mini bouquet seco.',
          price: 74.9,
          imageSeed: 'kit-presente-aromas',
        },
        {
          name: 'Caneca Personalizada',
          description: 'Arte personalizada em ate 2 dias uteis.',
          price: 39.9,
          imageSeed: 'caneca-personalizada',
        },
        {
          name: 'Caixa Floral Afeto',
          description: 'Arranjo permanente com cartao e embalagem premium.',
          price: 129.0,
          imageSeed: 'caixa-floral-afeto',
        },
      ],
    },
  },
  {
    email: 'paulo.teixeira@palmital.test',
    phone: '+5518997100014',
    displayName: 'Paulo Teixeira',
    username: 'paulo_teixeira',
    city: 'Ourinhos',
    bio: 'Tecnico em eletronica e fundador da Tech Vale Assistencia.',
    avatarSeed: 'Paulo Teixeira',
    coverSeed: 'Paulo Teixeira cover',
    company: {
      name: 'Tech Vale Assistencia',
      slug: 'tech-vale-assistencia',
      description: 'Assistencia tecnica, upgrades e venda de equipamentos revisados.',
      phone: '(14) 3326-4077',
      address: 'Rua Antonio Prado, 401',
      city: 'Ourinhos',
      category: 'Tecnologia',
      isVerified: true,
      coverSeed: 'Tech Vale Assistencia',
      products: [
        {
          name: 'Notebook Dell i5 16GB',
          description: 'Notebook revisado, SSD 512GB e bateria em bom estado.',
          price: 2790,
          imageSeed: 'notebook-dell-i5-16gb',
        },
        {
          name: 'SSD 480GB com Instalacao',
          description: 'Upgrade completo para desktop ou notebook.',
          price: 369.9,
          imageSeed: 'ssd-480gb-instalacao',
        },
        {
          name: 'Roteador Mesh Dual Band',
          description: 'Cobertura ampliada para casas e pequenos escritorios.',
          price: 559,
          imageSeed: 'roteador-mesh-dual-band',
        },
        {
          name: 'Troca de Tela Redmi Note',
          description: 'Servico com peca premium e garantia de 90 dias.',
          price: 420,
          imageSeed: 'troca-tela-redmi-note',
        },
      ],
    },
  },
  {
    email: 'renata.barbosa@palmital.test',
    phone: '+5518997100015',
    displayName: 'Renata Barbosa',
    username: 'renata_barbosa',
    city: 'Palmital',
    bio: 'Corretora e especialista em imoveis residenciais e rurais.',
    avatarSeed: 'Renata Barbosa',
    coverSeed: 'Renata Barbosa cover',
    company: {
      name: 'Imobiliaria Centro Oeste',
      slug: 'imobiliaria-centro-oeste',
      description: 'Compra, venda e locacao de imoveis com atendimento consultivo.',
      phone: '(18) 3351-9080',
      address: 'Rua Manoel Leao Rego, 119',
      city: 'Palmital',
      category: 'Imoveis',
      isVerified: true,
      coverSeed: 'Imobiliaria Centro Oeste',
      products: [
        {
          name: 'Casa 2 quartos no Centro',
          description: 'Imovel reformado, garagem coberta e quintal amplo.',
          price: 265000,
          imageSeed: 'casa-2-quartos-centro',
        },
        {
          name: 'Terreno 250m2 Jardim Paulista',
          description: 'Lote plano, documentacao em dia e boa localizacao.',
          price: 85000,
          imageSeed: 'terreno-250m2-jardim-paulista',
        },
        {
          name: 'Sala Comercial Reformada',
          description: 'Espaco pronto para consultorio ou escritorio.',
          price: 198000,
          imageSeed: 'sala-comercial-reformada',
        },
        {
          name: 'Chacara para Lazer',
          description: 'Area verde, piscina e espaco gourmet completo.',
          price: 420000,
          imageSeed: 'chacara-para-lazer',
        },
      ],
    },
  },
];

const socialPosts: PostSeed[] = [
  {
    authorEmail: 'ana.souza@palmital.test',
    content: 'Cobri a feira de domingo cedo e a cidade estava cheia. Vou subir mais fotos depois.',
    createdAt: hoursAgo(2),
    mediaSeeds: ['feira-domingo-cedo', 'barracas-feira-palmital'],
  },
  {
    authorEmail: 'bruno.lima@palmital.test',
    content:
      'Testei um novo trajeto de bike saindo de Assis para Palmital. Visual muito bom e estrada tranquila.',
    createdAt: hoursAgo(6),
    mediaSeeds: ['trilha-bike-assis-palmital'],
  },
  {
    authorEmail: 'carla.fernandes@palmital.test',
    content:
      'As aulas voltam amanha e ja deixei tudo separado. Quem estiver doando material escolar, fala comigo.',
    createdAt: hoursAgo(9),
  },
  {
    authorEmail: 'diego.alves@palmital.test',
    content: 'Projeto do Fusca azul avancando. Hoje foi dia de revisar freio e parte eletrica.',
    createdAt: hoursAgo(13),
    mediaSeeds: ['fusca-azul-oficina'],
  },
  {
    authorEmail: 'elisa.moraes@palmital.test',
    content:
      'Passei a tarde visitando tres imoveis em Palmital. Mercado bem aquecido para casas compactas.',
    createdAt: hoursAgo(18),
  },
  {
    authorEmail: 'fabio.gomes@palmital.test',
    content:
      'Treino de 10 km concluido na pista do estadio. Se alguem quiser montar grupo de corrida, animo.',
    createdAt: hoursAgo(22),
  },
  {
    authorEmail: 'gabriela.rocha@palmital.test',
    content:
      'Atendimento cheio hoje no consultorio. Lembrem da vacina e da vermifugacao dos filhotes.',
    createdAt: hoursAgo(27),
    mediaSeeds: ['consultorio-pet-gabriela'],
  },
  {
    authorEmail: 'henrique.nunes@palmital.test',
    content: 'Finalize um setup gamer enxuto e ficou muito equilibrado para estudo e trabalho.',
    createdAt: hoursAgo(31),
    mediaSeeds: ['setup-gamer-enxuto'],
  },
  {
    authorEmail: 'ana.souza@palmital.test',
    content: 'Por do sol bonito demais hoje no trevo. A luz da tarde estava perfeita.',
    createdAt: hoursAgo(36),
    mediaSeeds: ['por-do-sol-trevo-palmital'],
  },
  {
    authorEmail: 'carla.fernandes@palmital.test',
    content:
      'Receitas simples para lanche da semana salvaram minha rotina. Se quiserem eu posto a lista.',
    createdAt: hoursAgo(40),
  },
  {
    authorEmail: 'fabio.gomes@palmital.test',
    content: 'Descobri uma cafeteria nova perto da pracinha e o cafe coado vale a visita.',
    createdAt: hoursAgo(46),
    mediaSeeds: ['cafeteria-pracinha'],
  },
  {
    authorEmail: 'gabriela.rocha@palmital.test',
    content:
      'Adocao responsavel continua sendo a melhor saida. Tenho contato de duas ONGs da regiao se precisarem.',
    createdAt: hoursAgo(52),
  },
  {
    authorEmail: 'leonardo.ferrari@palmital.test',
    content:
      'Fechei a agenda da semana para troca de padrao e instalacao de chuveiro. Se alguem precisar de visita tecnica, me chama.',
    createdAt: hoursAgo(12),
  },
  {
    authorEmail: 'patricia.azevedo@palmital.test',
    content:
      'Terminei uma pintura em tons claros que abriu bem o ambiente. Posso postar antes e depois se quiserem.',
    createdAt: hoursAgo(21),
    mediaSeeds: ['pintura-antes-depois-sala', 'parede-clara-acabamento'],
  },
  {
    authorEmail: 'henrique.nunes@palmital.test',
    content:
      'Montei tres kits para home office hoje. Monitor certo e cadeira decente fazem muita diferenca.',
    createdAt: hoursAgo(29),
  },
  {
    authorEmail: 'diego.alves@palmital.test',
    content:
      'Quem tiver precisando revisar freio antes da viagem do feriado, tenta agendar hoje porque a oficina lota rapido.',
    createdAt: hoursAgo(44),
  },
];

const businessPosts: BusinessPostSeed[] = [
  {
    authorEmail: 'mariana.silva@palmital.test',
    companySlug: 'casa-do-campo-palmital',
    content: 'Chegou lote novo de racao premium e mineral bovino. Entrega na cidade no mesmo dia.',
    createdAt: hoursAgo(4),
    mediaSeeds: ['estoque-casa-do-campo'],
  },
  {
    authorEmail: 'mariana.silva@palmital.test',
    companySlug: 'casa-do-campo-palmital',
    content: 'Equipe tecnica disponivel para orientar sobre manejo de pastagem e suplementacao.',
    createdAt: hoursAgo(32),
  },
  {
    authorEmail: 'ricardo.melo@palmital.test',
    companySlug: 'auto-prime-palmital',
    content: 'Semana de avaliacao para troca. Traga seu seminovo e receba proposta na hora.',
    createdAt: hoursAgo(8),
    mediaSeeds: ['auto-prime-vitrine'],
  },
  {
    authorEmail: 'ricardo.melo@palmital.test',
    companySlug: 'auto-prime-palmital',
    content: 'Onix LT 2021 revisado entrou no estoque hoje com garantia de procedencia.',
    createdAt: hoursAgo(41),
    mediaSeeds: ['onix-lt-vitrine'],
  },
  {
    authorEmail: 'juliana.ribeiro@palmital.test',
    companySlug: 'atelier-flor-de-cafe',
    content: 'Abrimos agenda para cestas corporativas de aniversario e kits de boas-vindas.',
    createdAt: hoursAgo(11),
    mediaSeeds: ['cestas-corporativas'],
  },
  {
    authorEmail: 'juliana.ribeiro@palmital.test',
    companySlug: 'atelier-flor-de-cafe',
    content: 'A caixa floral afeto segue como o presente mais pedido da semana.',
    createdAt: hoursAgo(49),
    mediaSeeds: ['caixa-floral-vitrine'],
  },
  {
    authorEmail: 'paulo.teixeira@palmital.test',
    companySlug: 'tech-vale-assistencia',
    content:
      'Recebemos lote de notebooks revisados com SSD e garantia. Ideal para estudo e home office.',
    createdAt: hoursAgo(15),
    mediaSeeds: ['tech-vale-notebooks'],
  },
  {
    authorEmail: 'paulo.teixeira@palmital.test',
    companySlug: 'tech-vale-assistencia',
    content: 'Fazemos troca de tela e upgrade com retirada programada em Ourinhos e regiao.',
    createdAt: hoursAgo(57),
  },
  // ─── Boutique Vic ───
  {
    authorEmail: 'boutique.moda@palmital.test',
    companySlug: 'boutique-vic',
    content: 'Nova coleção chegando! Separamos peças exclusivas para renovar seu visual essa semana.',
    createdAt: hoursAgo(3),
    mediaSeeds: ['boutique-vic-nova-colecao', 'boutique-vic-vitrine'],
  },
  {
    authorEmail: 'boutique.moda@palmital.test',
    companySlug: 'boutique-vic',
    content: 'Vestido Midi Floral esgotou em 2 dias na última remessa. Chegou mais, corre!',
    createdAt: hoursAgo(28),
    mediaSeeds: ['vestido-midi-floral-loja'],
  },
  // ─── Padaria Central ───
  {
    authorEmail: 'padaria.central@palmital.test',
    companySlug: 'padaria-central-palmital',
    content: 'Hoje saiu bolo de cenoura fresquinho com cobertura de chocolate belga. Passa aqui antes das 18h!',
    createdAt: hoursAgo(5),
    mediaSeeds: ['padaria-bolo-cenoura', 'padaria-central-balcao'],
  },
  {
    authorEmail: 'padaria.central@palmital.test',
    companySlug: 'padaria-central-palmital',
    content: '22 anos fazendo o pão de Palmital. Obrigado à toda a comunidade pela confiança.',
    createdAt: hoursAgo(43),
  },
  // ─── Farmácia Saúde & Vida ───
  {
    authorEmail: 'farmacia.saude@palmital.test',
    companySlug: 'farmacia-saude-vida',
    content: 'Proteja sua pele no verão. Temos protetor solar FPS 50+ com o melhor preço da cidade.',
    createdAt: hoursAgo(6),
    mediaSeeds: ['farmacia-produtos-solar', 'farmacia-saude-vida-fachada'],
  },
  {
    authorEmail: 'farmacia.saude@palmital.test',
    companySlug: 'farmacia-saude-vida',
    content: 'Atendimento farmacêutico gratuito para dúvidas sobre medicamentos e interações. Venha nos visitar.',
    createdAt: hoursAgo(37),
  },
  {
    authorEmail: 'renata.barbosa@palmital.test',
    companySlug: 'imobiliaria-centro-oeste',
    content: 'Entrou captacao nova de casa compacta no centro com quintal e documentacao pronta.',
    createdAt: hoursAgo(19),
    mediaSeeds: ['captacao-casa-centro'],
  },
  {
    authorEmail: 'renata.barbosa@palmital.test',
    companySlug: 'imobiliaria-centro-oeste',
    content: 'Se voce procura terreno para construir em bairro tranquilo, chama no direct.',
    createdAt: hoursAgo(63),
    mediaSeeds: ['terrenos-centro-oeste'],
  },
  {
    authorEmail: 'paulo.teixeira@palmital.test',
    companySlug: 'tech-vale-assistencia',
    content:
      'Montamos kits de upgrade com SSD, limpeza interna e retirada agendada para empresas da regiao.',
    createdAt: hoursAgo(26),
  },
  {
    authorEmail: 'juliana.ribeiro@palmital.test',
    companySlug: 'atelier-flor-de-cafe',
    content:
      'Hoje sairam tres kits corporativos com cartao personalizado e entrega no horario do cliente.',
    createdAt: hoursAgo(34),
    mediaSeeds: ['kits-corporativos-cafe', 'embalagem-presente-flores'],
  },
];

const promotionPosts: PromotionSeed[] = [
  // ─── Novas empresas — products cards recentes no topo do feed ───
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'boutique.moda@palmital.test',
    companySlug: 'boutique-vic',
    createdAt: hoursAgo(1),
    content: 'Chegaram peças novas essa semana. Vem conferir antes de esgotar!',
    headline: 'Moda feminina com estilo e preço justo',
    subtitle: 'Novidades semanais para renovar o guarda-roupa sem sair de Palmital.',
    city: 'Palmital',
    serviceArea: 'Palmital e região',
    highlights: ['entrega na cidade', 'troca em 7 dias', 'tamanhos P ao GG'],
    productNames: ['Vestido Midi Floral', 'Conjunto Linho Bege', 'Bolsa Couro Caramelo'],
  },
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'boutique.moda@palmital.test',
    companySlug: 'boutique-vic',
    createdAt: hoursAgo(2),
    content: 'Looks do dia a dia para a mulher que não abre mão do estilo.',
    headline: 'Coleção casual: sandália, blusa e mais',
    subtitle: 'Peças versáteis para trabalho, passeio e eventos informais.',
    city: 'Palmital',
    serviceArea: 'Palmital e região',
    highlights: ['modelos exclusivos', 'qualidade comprovada', 'whatsapp disponível'],
    productNames: ['Sandália Flatform Nude', 'Blusa Cropped Rib', 'Vestido Midi Floral'],
  },
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'padaria.central@palmital.test',
    companySlug: 'padaria-central-palmital',
    createdAt: hoursAgo(1),
    content: 'Saiu do forno! Pedidos para entrega até as 10h da manhã.',
    headline: 'Padaria aberta das 5h — pão quentinho todo dia',
    subtitle: 'Pão francês, bolos e salgados artesanais. Entrega no centro de Palmital.',
    city: 'Palmital',
    serviceArea: 'Centro de Palmital',
    highlights: ['aberto às 5h', 'entrega no centro', 'encomendas especiais'],
    productNames: ['Pão Francês (dúzia)', 'Bolo de Cenoura com Cobertura', 'Coxinha de Frango (10 un)'],
  },
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'padaria.central@palmital.test',
    companySlug: 'padaria-central-palmital',
    createdAt: hoursAgo(3),
    content: 'Café da manhã completo para começar bem o dia. Reserve o seu!',
    headline: 'Café da manhã e bolos para encomendar',
    subtitle: 'Bolos decorados e café da manhã montado com carinho para datas especiais.',
    city: 'Palmital',
    serviceArea: 'Palmital e região',
    highlights: ['entrega no dia', 'cardápio variado', 'encomenda com 3 dias'],
    productNames: ['Café da Manhã Completo', 'Encomenda de Bolo Decorado', 'Bolo de Cenoura com Cobertura'],
  },
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'farmacia.saude@palmital.test',
    companySlug: 'farmacia-saude-vida',
    createdAt: hoursAgo(2),
    content: 'Promoção de dermocosméticos e suplementos essa semana. Atendimento farmacêutico gratuito.',
    headline: 'Saúde e beleza com orientação profissional',
    subtitle: 'Protetor solar, vitaminas e sérum anti-idade com melhor preço da região.',
    city: 'Palmital',
    serviceArea: 'Palmital e região',
    highlights: ['farmacêutico no local', 'delivery de medicamentos', 'preço competitivo'],
    productNames: ['Protetor Solar FPS 50+', 'Vitamina C 1000mg (30 cp)', 'Sérum Anti-Idade Vitamina A'],
  },
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'farmacia.saude@palmital.test',
    companySlug: 'farmacia-saude-vida',
    createdAt: hoursAgo(4),
    content: 'Kit cuidado facial e colágeno em promoção. Invista na sua pele!',
    headline: 'Cuidado com a pele: kits completos e colágeno',
    subtitle: 'Linha premium de skincare com orientação personalizada da nossa farmacêutica.',
    city: 'Palmital',
    serviceArea: 'Palmital',
    highlights: ['orientação gratuita', 'produtos originais', 'entrega disponível'],
    productNames: ['Kit Cuidado Facial Completo', 'Colágeno Hidrolisado (300g)', 'Protetor Solar FPS 50+'],
  },
  // ─── Profissionais ───
  {
    kind: PromotionKind.PROFESSIONAL,
    authorEmail: 'leonardo.ferrari@palmital.test',
    createdAt: hoursAgo(5),
    content:
      'Atendo residencias, pequenos comercios e reparos urgentes com visita tecnica organizada.',
    headline: 'Eletricista residencial com atendimento rapido',
    subtitle: 'Padrao, disjuntor, chuveiro, ventilador e manutencao preventiva.',
    city: 'Palmital',
    serviceArea: 'Palmital, Ibirarema e Campos Novos Paulista',
    highlights: ['orcamento rapido', 'atendimento no mesmo dia', 'instalacoes residenciais'],
  },
  {
    kind: PromotionKind.PROFESSIONAL,
    authorEmail: 'patricia.azevedo@palmital.test',
    createdAt: hoursAgo(16),
    content:
      'Trabalho com pintura interna, massa corrida, textura leve e organizacao do ambiente no fim do servico.',
    headline: 'Pintura residencial e comercial com acabamento fino',
    subtitle: 'Ideal para reforma, entrega de imovel e revitalizacao de ambientes.',
    city: 'Ourinhos',
    serviceArea: 'Ourinhos, Palmital e Candido Mota',
    highlights: ['acabamento limpo', 'cores orientadas', 'parcelamento combinado'],
  },
  {
    kind: PromotionKind.COMPANY_PROFILE,
    authorEmail: 'mariana.silva@palmital.test',
    companySlug: 'casa-do-campo-palmital',
    createdAt: hoursAgo(7),
    content:
      'A loja esta com equipe reforcada para atendimento tecnico e entrega local no mesmo dia.',
    headline: 'Tudo para nutricao animal e rotina do campo',
    subtitle: 'Atendimento tecnico, insumos selecionados e suporte para produtor da regiao.',
    city: 'Palmital',
    serviceArea: 'Palmital e propriedades vizinhas',
    highlights: ['entrega local', 'suporte tecnico', 'linha pet e rural'],
  },
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'paulo.teixeira@palmital.test',
    companySlug: 'tech-vale-assistencia',
    createdAt: hoursAgo(8),
    content:
      'Selecionamos equipamentos e servicos com maior giro para facilitar o teste do novo card comercial.',
    headline: 'Vitrine de tecnologia revisada e pronta para uso',
    subtitle: 'Produtos e servicos com foco em estudo, trabalho e upgrade rapido.',
    city: 'Ourinhos',
    serviceArea: 'Ourinhos, Palmital e Santa Cruz do Rio Pardo',
    highlights: ['garantia local', 'upgrade com instalacao', 'equipamentos revisados'],
    productNames: ['Notebook Dell i5 16GB', 'SSD 480GB com Instalacao', 'Roteador Mesh Dual Band'],
  },
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'mariana.silva@palmital.test',
    companySlug: 'casa-do-campo-palmital',
    createdAt: hoursAgo(10),
    content: 'Produtos mais pedidos no balcao esta semana, com entrega local e orientacao de uso.',
    headline: 'Produtos rurais e pet em destaque na loja',
    subtitle: 'Selecao para testar posts com produtos diretamente no perfil publico da loja.',
    city: 'Palmital',
    serviceArea: 'Palmital e propriedades vizinhas',
    highlights: ['entrega no mesmo dia', 'retirada na loja', 'orientacao tecnica'],
    productNames: ['Racao Premium 25kg', 'Mineral Bovino 30kg', 'Pulverizador Costal 20L'],
  },
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'ricardo.melo@palmital.test',
    companySlug: 'auto-prime-palmital',
    createdAt: hoursAgo(12),
    content:
      'Usamos essa vitrine para destacar produtos e servicos que puxam mais conversa no feed.',
    headline: 'Seminovos e acessorios automotivos em destaque',
    subtitle: 'Selecao de estoque e itens que ajudam a fechar venda mais rapido.',
    city: 'Palmital',
    serviceArea: 'Palmital e regiao',
    highlights: ['estoque revisado', 'avaliacao na troca', 'acessorios prontos para instalar'],
    productNames: ['Chevrolet Onix LT 2021', 'Honda CG 160 Fan 2022', 'Multimidia 9 polegadas'],
  },
  {
    kind: PromotionKind.COMPANY_PRODUCTS,
    authorEmail: 'juliana.ribeiro@palmital.test',
    companySlug: 'atelier-flor-de-cafe',
    createdAt: hoursAgo(16),
    content: 'Monte um presente completo escolhendo os itens da vitrine e personalize o cartao.',
    headline: 'Kits e presentes artesanais para testar vitrine',
    subtitle: 'Opcoes com foto, preco e descricao para validar o card no perfil da loja.',
    city: 'Candido Mota',
    serviceArea: 'Candido Mota, Palmital e Assis',
    highlights: ['pedido por encomenda', 'embalagem pronta', 'cartao personalizado'],
    productNames: ['Cesta Cafe da Tarde', 'Kit Presente Aromas', 'Caixa Floral Afeto'],
  },
];

const classifiedCatalog: Array<{
  categorySlug: string;
  city: string;
  items: ClassifiedItemSeed[];
}> = [
  {
    categorySlug: 'veiculos',
    city: 'Palmital',
    items: [
      {
        title: 'Bicicleta aro 29 revisada',
        description: 'Quadro de aluminio, freio a disco e revisao feita este mes.',
        price: 1250,
      },
      {
        title: 'CG 160 Start 2021',
        description: 'Moto economica, documentos em dia e pneus trocados recentemente.',
        price: 10900,
      },
      {
        title: 'Carretinha fechada para carga',
        description: 'Estrutura reforcada, ideal para pequenos fretes e eventos.',
        price: 3800,
      },
      {
        title: 'Capacete LS2 tamanho 60',
        description: 'Pouco uso, viseira em bom estado e sem quedas.',
        price: 450,
      },
    ],
  },
  {
    categorySlug: 'imoveis',
    city: 'Palmital',
    items: [
      {
        title: 'Casa 2 quartos proxima ao centro',
        description: 'Sala integrada, garagem coberta e quintal com area de servico.',
        price: 255000,
      },
      {
        title: 'Terreno 250m2 no Jardim Paulista',
        description: 'Lote plano, rua asfaltada e documentacao pronta para financiar.',
        price: 82000,
      },
      {
        title: 'Kitnet mobiliada para locacao',
        description: 'Ideal para estudante ou casal, perto de mercado e farmacia.',
        price: 950,
      },
      {
        title: 'Sala comercial com vitrine',
        description: 'Espaco recem-pintado com banheiro e recuo frontal.',
        price: 179000,
      },
    ],
  },
  {
    categorySlug: 'eletronicos',
    city: 'Ourinhos',
    items: [
      {
        title: 'iPhone 13 128GB azul',
        description: 'Saude de bateria em 88%, aparelho sem trincas e com caixa.',
        price: 2890,
      },
      {
        title: 'Notebook Dell i5 16GB',
        description: 'SSD 512GB e muito bom para trabalho e estudo.',
        price: 2750,
      },
      {
        title: 'TV 50 polegadas 4K',
        description: 'Painel sem manchas, acompanha controle e suporte.',
        price: 2100,
      },
      {
        title: 'Camera Canon T6 com lente 18-55',
        description: 'Equipamento bem conservado e pronto para uso.',
        price: 2400,
      },
    ],
  },
  {
    categorySlug: 'casa-e-estilo',
    city: 'Candido Mota',
    items: [
      {
        title: 'Sofa retratil 3 lugares',
        description: 'Tecido suede cinza, macio e sem rasgos.',
        price: 1650,
      },
      {
        title: 'Mesa de jantar com 6 cadeiras',
        description: 'Madeira macica e tampo muito bem conservado.',
        price: 2200,
      },
      {
        title: 'Berco americano desmontavel',
        description: 'Vai com colchao e kit de montagem completo.',
        price: 480,
      },
      {
        title: 'Caixa de roupas femininas tamanho M',
        description: 'Lote para doacao com pecas em bom estado.',
        isFree: true,
      },
    ],
  },
  {
    categorySlug: 'servicos',
    city: 'Palmital',
    items: [
      {
        title: 'Frete para Palmital e regiao',
        description: 'Mudancas pequenas, entrega de moveis e viagens sob agendamento.',
        price: 120,
      },
      {
        title: 'Pintura residencial por diaria',
        description: 'Acabamento caprichado, material negociado a parte.',
        price: 280,
      },
      {
        title: 'Aulas particulares de matematica',
        description: 'Atendimento para fundamental e medio, presencial ou online.',
        price: 60,
      },
      {
        title: 'Diarista semanal',
        description: 'Vagas para casa ou escritorio com referencias na cidade.',
        price: 160,
      },
    ],
  },
  {
    categorySlug: 'agro-e-animais',
    city: 'Maracai',
    items: [
      {
        title: 'Bezerra nelore 8 meses',
        description: 'Animal sadio, bem tratado e com manejo recente.',
        price: 3200,
      },
      {
        title: 'Filhotes de border collie',
        description: 'Pais no local, vacinados e com orientacao de cuidados.',
        price: 1800,
      },
      {
        title: 'Pulverizador costal seminovo',
        description: 'Equipamento funcionando bem e com poucas horas de uso.',
        price: 230,
      },
      {
        title: 'Mudas de tempero variadas',
        description: 'Tenho manjericao, alecrim e cebolinha para doacao.',
        isFree: true,
      },
    ],
  },
];

function statusForClassified(index: number) {
  if (index >= 21 && index <= 22) return ClassifiedStatus.SOLD;
  if (index === 23) return ClassifiedStatus.PAUSED;
  return ClassifiedStatus.ACTIVE;
}

function buildConversationSeeds(): ConversationSeed[] {
  return [
    {
      participants: ['ana.souza@palmital.test', 'mariana.silva@palmital.test'],
      messages: [
        {
          senderEmail: 'ana.souza@palmital.test',
          content: 'Oi, voces entregam racao ainda hoje em Palmital?',
          status: MessageStatus.READ,
          createdAt: hoursAgo(14),
        },
        {
          senderEmail: 'mariana.silva@palmital.test',
          content: 'Entregamos sim. Se confirmar ate as 16h vai no fim da tarde.',
          status: MessageStatus.READ,
          createdAt: hoursAgo(13),
        },
        {
          senderEmail: 'ana.souza@palmital.test',
          content: 'Perfeito. Quero uma unidade da premium 25kg.',
          status: MessageStatus.DELIVERED,
          createdAt: hoursAgo(12),
        },
      ],
      lastReadAt: {
        'ana.souza@palmital.test': hoursAgo(11),
        'mariana.silva@palmital.test': hoursAgo(11),
      },
    },
    {
      participants: ['bruno.lima@palmital.test', 'ricardo.melo@palmital.test'],
      messages: [
        {
          senderEmail: 'bruno.lima@palmital.test',
          content: 'O Onix ainda esta disponivel para visita?',
          status: MessageStatus.READ,
          createdAt: hoursAgo(20),
        },
        {
          senderEmail: 'ricardo.melo@palmital.test',
          content: 'Sim, esta na loja e posso mostrar amanha de manha.',
          status: MessageStatus.READ,
          createdAt: hoursAgo(19),
        },
        {
          senderEmail: 'bruno.lima@palmital.test',
          content: 'Fechado. Passo por volta das 9h.',
          status: MessageStatus.READ,
          createdAt: hoursAgo(18),
        },
      ],
      lastReadAt: {
        'bruno.lima@palmital.test': hoursAgo(17),
        'ricardo.melo@palmital.test': hoursAgo(17),
      },
    },
    {
      participants: ['carla.fernandes@palmital.test', 'juliana.ribeiro@palmital.test'],
      messages: [
        {
          senderEmail: 'carla.fernandes@palmital.test',
          content: 'Voce monta cesta para aniversario infantil?',
          status: MessageStatus.READ,
          createdAt: hoursAgo(26),
        },
        {
          senderEmail: 'juliana.ribeiro@palmital.test',
          content: 'Monto sim. Posso adaptar em cores e faixa de preco.',
          status: MessageStatus.DELIVERED,
          createdAt: hoursAgo(25),
        },
      ],
      lastReadAt: {
        'carla.fernandes@palmital.test': hoursAgo(24),
        'juliana.ribeiro@palmital.test': hoursAgo(24),
      },
    },
    {
      participants: ['henrique.nunes@palmital.test', 'paulo.teixeira@palmital.test'],
      messages: [
        {
          senderEmail: 'henrique.nunes@palmital.test',
          content: 'Consegue trocar SSD de um notebook Lenovo ainda essa semana?',
          status: MessageStatus.READ,
          createdAt: hoursAgo(8),
        },
        {
          senderEmail: 'paulo.teixeira@palmital.test',
          content: 'Consigo. Se deixar hoje, entrego amanha no fim da tarde.',
          status: MessageStatus.READ,
          createdAt: hoursAgo(7),
        },
        {
          senderEmail: 'henrique.nunes@palmital.test',
          content: 'Vou levar depois do almoco.',
          status: MessageStatus.SENT,
          createdAt: hoursAgo(6),
        },
      ],
      lastReadAt: {
        'henrique.nunes@palmital.test': hoursAgo(6),
        'paulo.teixeira@palmital.test': null,
      },
    },
    {
      participants: ['elisa.moraes@palmital.test', 'renata.barbosa@palmital.test'],
      messages: [
        {
          senderEmail: 'elisa.moraes@palmital.test',
          content: 'Gostei da casa compacta no centro. Ainda aceita financiamento?',
          status: MessageStatus.READ,
          createdAt: hoursAgo(30),
        },
        {
          senderEmail: 'renata.barbosa@palmital.test',
          content: 'Aceita sim. Posso te enviar a documentacao e marcar visita.',
          status: MessageStatus.READ,
          createdAt: hoursAgo(29),
        },
        {
          senderEmail: 'elisa.moraes@palmital.test',
          content: 'Me manda por aqui, por favor.',
          status: MessageStatus.DELIVERED,
          createdAt: hoursAgo(28),
        },
      ],
      lastReadAt: {
        'elisa.moraes@palmital.test': hoursAgo(27),
        'renata.barbosa@palmital.test': hoursAgo(27),
      },
    },
    {
      participants: ['fabio.gomes@palmital.test', 'gabriela.rocha@palmital.test'],
      messages: [
        {
          senderEmail: 'fabio.gomes@palmital.test',
          content: 'Voce atende caes no sabado de manha?',
          status: MessageStatus.READ,
          createdAt: hoursAgo(34),
        },
        {
          senderEmail: 'gabriela.rocha@palmital.test',
          content: 'Atendo sim, mas com horario marcado.',
          status: MessageStatus.READ,
          createdAt: hoursAgo(33),
        },
      ],
      lastReadAt: {
        'fabio.gomes@palmital.test': hoursAgo(32),
        'gabriela.rocha@palmital.test': hoursAgo(32),
      },
    },
  ];
}

async function ensureCategories() {
  const categoryIds: Record<string, string> = {};

  for (const category of categoryTree) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        iconName: category.iconName,
        parentId: null,
      },
      create: {
        name: category.name,
        slug: category.slug,
        iconName: category.iconName,
      },
    });

    categoryIds[category.slug] = parent.id;

    for (const child of category.children ?? []) {
      const item = await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          iconName: child.iconName,
          parentId: parent.id,
        },
        create: {
          name: child.name,
          slug: child.slug,
          iconName: child.iconName,
          parentId: parent.id,
        },
      });

      categoryIds[child.slug] = item.id;
    }
  }

  return categoryIds;
}

async function cleanupSeedNamespace() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: TEST_DOMAIN } },
    select: { id: true },
  });

  if (!users.length) return;

  const userIds = users.map((user) => user.id);
  const companies = await prisma.company.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const companyIds = companies.map((company) => company.id);

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { authorId: { in: userIds } },
        ...(companyIds.length ? [{ companyId: { in: companyIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const postIds = posts.map((post) => post.id);

  const participations = await prisma.conversationParticipant.findMany({
    where: { userId: { in: userIds } },
    select: { conversationId: true },
  });
  const conversationIds = [...new Set(participations.map((item) => item.conversationId))];

  if (conversationIds.length) {
    await prisma.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: { in: conversationIds } },
    });
    await prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } });
  }

  await prisma.media.deleteMany({
    where: {
      OR: [
        { uploaderId: { in: userIds } },
        ...(postIds.length ? [{ postId: { in: postIds } }] : []),
      ],
    },
  });

  if (postIds.length) {
    await prisma.post.deleteMany({ where: { id: { in: postIds } } });
  }

  if (companyIds.length) {
    await prisma.product.deleteMany({ where: { companyId: { in: companyIds } } });
    await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
  }

  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function ensureAdmin(adminPassword: string) {
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  return prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      profile: {
        upsert: {
          update: {
            displayName: 'Admin Palmital',
            username: 'admin_palmital',
            city: 'Palmital',
            bio: 'Conta administrativa para revisar moderacao, usuarios e operacao geral.',
            avatarUrl: avatarUrl('Admin Palmital'),
            coverUrl: imageUrl('Admin Palmital cover', 1600, 900),
          },
          create: {
            displayName: 'Admin Palmital',
            username: 'admin_palmital',
            city: 'Palmital',
            bio: 'Conta administrativa para revisar moderacao, usuarios e operacao geral.',
            avatarUrl: avatarUrl('Admin Palmital'),
            coverUrl: imageUrl('Admin Palmital cover', 1600, 900),
          },
        },
      },
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      profile: {
        create: {
          displayName: 'Admin Palmital',
          username: 'admin_palmital',
          city: 'Palmital',
          bio: 'Conta administrativa para revisar moderacao, usuarios e operacao geral.',
          avatarUrl: avatarUrl('Admin Palmital'),
          coverUrl: imageUrl('Admin Palmital cover', 1600, 900),
        },
      },
    },
  });
}

async function createUsers(testPassword: string) {
  const passwordHash = await bcrypt.hash(testPassword, 12);
  const usersByEmail = new Map<string, { id: string; email: string; role: UserRole }>();
  const companiesBySlug = new Map<string, { id: string; slug: string; ownerId: string }>();
  const productsByCompanySlug = new Map<string, Array<{ id: string; name: string }>>();

  for (const user of regularUsers) {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        phone: user.phone,
        passwordHash,
        role: UserRole.USER,
        profile: {
          create: {
            displayName: user.displayName,
            username: user.username,
            city: user.city,
            bio: user.bio,
            avatarUrl: avatarUrl(user.avatarSeed),
            coverUrl: imageUrl(user.coverSeed, 1600, 900),
          },
        },
      },
    });

    usersByEmail.set(created.email, { id: created.id, email: created.email, role: created.role });
  }

  for (const user of businessUsers) {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        phone: user.phone,
        passwordHash,
        role: UserRole.BUSINESS_OWNER,
        profile: {
          create: {
            displayName: user.displayName,
            username: user.username,
            city: user.city,
            bio: user.bio,
            avatarUrl: avatarUrl(user.avatarSeed),
            coverUrl: imageUrl(user.coverSeed, 1600, 900),
          },
        },
        company: {
          create: {
            name: user.company.name,
            slug: user.company.slug,
            description: user.company.description,
            phone: user.company.phone,
            address: user.company.address,
            city: user.company.city,
            category: user.company.category,
            isVerified: user.company.isVerified,
            logoUrl: avatarUrl(user.company.name),
            coverUrl: imageUrl(user.company.coverSeed, 1600, 900),
            products: {
              create: user.company.products.map((product) => ({
                name: product.name,
                description: product.description,
                price: product.price,
                imageUrl: imageUrl(product.imageSeed, 1200, 900),
                isAvailable: product.isAvailable ?? true,
              })),
            },
          },
        },
      },
      include: { company: { include: { products: true } } },
    });

    usersByEmail.set(created.email, { id: created.id, email: created.email, role: created.role });

    if (created.company) {
      companiesBySlug.set(created.company.slug, {
        id: created.company.id,
        slug: created.company.slug,
        ownerId: created.id,
      });
      productsByCompanySlug.set(
        created.company.slug,
        created.company.products.map((product) => ({ id: product.id, name: product.name })),
      );
    }
  }

  return { usersByEmail, companiesBySlug, productsByCompanySlug };
}

async function createPostWithMedia(params: {
  authorId: string;
  type: PostType;
  content: string;
  createdAt: Date;
  companyId?: string;
  mediaSeeds?: string[];
}) {
  const post = await prisma.post.create({
    data: {
      authorId: params.authorId,
      companyId: params.companyId,
      type: params.type,
      content: params.content,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    },
  });

  if (params.mediaSeeds?.length) {
    await prisma.media.createMany({
      data: params.mediaSeeds.map((seed, index) => ({
        postId: post.id,
        uploaderId: params.authorId,
        url: imageUrl(seed, 1200, 1200),
        type: MediaType.IMAGE,
        mimeType: 'image/jpeg',
        sizeBytes: 180000 + index * 15000,
        width: 1200,
        height: 1200,
        createdAt: params.createdAt,
      })),
    });
  }

  return post;
}

async function createPostsAndClassifieds(
  usersByEmail: Map<string, { id: string }>,
  companiesBySlug: Map<string, { id: string }>,
  productsByCompanySlug: Map<string, Array<{ id: string; name: string }>>,
  categoryIds: Record<string, string>,
) {
  for (const post of socialPosts) {
    const author = usersByEmail.get(post.authorEmail);
    if (!author) throw new Error(`Author not found for ${post.authorEmail}`);

    await createPostWithMedia({
      authorId: author.id,
      type: PostType.SOCIAL,
      content: post.content,
      createdAt: post.createdAt,
      mediaSeeds: post.mediaSeeds,
    });
  }

  for (const post of businessPosts) {
    const author = usersByEmail.get(post.authorEmail);
    const company = companiesBySlug.get(post.companySlug);

    if (!author) throw new Error(`Business author not found for ${post.authorEmail}`);
    if (!company) throw new Error(`Company not found for ${post.companySlug}`);

    await createPostWithMedia({
      authorId: author.id,
      companyId: company.id,
      type: PostType.BUSINESS,
      content: post.content,
      createdAt: post.createdAt,
      mediaSeeds: post.mediaSeeds,
    });
  }

  const marketplaceEmails = [...regularUsers, ...businessUsers].map((user) => user.email);
  const entries = classifiedCatalog.flatMap((group) =>
    group.items.map((item) => ({ ...item, categorySlug: group.categorySlug, city: group.city })),
  );

  for (const [index, item] of entries.entries()) {
    const authorEmail = marketplaceEmails[index % marketplaceEmails.length];
    const author = usersByEmail.get(authorEmail);

    if (!author) throw new Error(`Marketplace author not found for ${authorEmail}`);

    const createdAt = hoursAgo(3 + index * 5);
    const post = await createPostWithMedia({
      authorId: author.id,
      type: PostType.CLASSIFIED,
      content: `${item.title}\n${item.description}`,
      createdAt,
      mediaSeeds: [`classified-${index + 1}`],
    });

    await prisma.classified.create({
      data: {
        postId: post.id,
        authorId: author.id,
        title: item.title,
        description: item.description,
        price: item.isFree ? null : item.price,
        isFree: item.isFree ?? false,
        status: statusForClassified(index),
        categoryId: categoryIds[item.categorySlug],
        city: item.city,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  for (const promotion of promotionPosts) {
    const author = usersByEmail.get(promotion.authorEmail);
    if (!author) throw new Error(`Promotion author not found for ${promotion.authorEmail}`);

    const companyId =
      'companySlug' in promotion ? companiesBySlug.get(promotion.companySlug)?.id : undefined;

    const selectedProductIds =
      'companySlug' in promotion && promotion.productNames?.length
        ? promotion.productNames.map((productName) => {
            const product = productsByCompanySlug
              .get(promotion.companySlug)
              ?.find((item) => item.name === productName);

            if (!product) {
              throw new Error(
                `Product not found for promotion: ${promotion.companySlug} -> ${productName}`,
              );
            }

            return product.id;
          })
        : [];

    await prisma.post.create({
      data: {
        authorId: author.id,
        companyId,
        type: PostType.PROMOTION,
        content: promotion.content,
        createdAt: promotion.createdAt,
        updatedAt: promotion.createdAt,
        promotion: {
          create: {
            kind: promotion.kind,
            headline: promotion.headline,
            subtitle: promotion.subtitle,
            city: promotion.city,
            serviceArea: promotion.serviceArea,
            highlights: promotion.highlights,
            createdAt: promotion.createdAt,
            updatedAt: promotion.createdAt,
            products: selectedProductIds.length
              ? {
                  create: selectedProductIds.map((productId, index) => ({
                    sortOrder: index,
                    product: { connect: { id: productId } },
                  })),
                }
              : undefined,
          },
        },
      },
    });
  }
}

async function createPostInteractions(usersByEmail: Map<string, { id: string }>) {
  const seedUsers = [...regularUsers, ...businessUsers]
    .map((user) => usersByEmail.get(user.email))
    .filter(Boolean) as Array<{ id: string }>;

  if (!seedUsers.length) return;

  const posts = await prisma.post.findMany({
    where: { authorId: { in: seedUsers.map((user) => user.id) } },
    orderBy: { createdAt: 'desc' },
    take: 18,
    select: { id: true, authorId: true },
  });

  const reactionTypes = [
    PostReactionType.LIKE,
    PostReactionType.LOVE,
    PostReactionType.CLAP,
    PostReactionType.WOW,
  ];

  for (const [postIndex, post] of posts.entries()) {
    const reactors = seedUsers
      .filter((user) => user.id !== post.authorId)
      .slice(postIndex % 3, (postIndex % 3) + 5);

    for (const [reactorIndex, user] of reactors.entries()) {
      await prisma.postReaction.create({
        data: {
          postId: post.id,
          userId: user.id,
          type: reactionTypes[(postIndex + reactorIndex) % reactionTypes.length],
          createdAt: hoursAgo(1 + postIndex + reactorIndex),
        },
      });
    }

    const commenters = reactors.slice(0, 2);
    for (const [commentIndex, user] of commenters.entries()) {
      await prisma.postComment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content:
            commentIndex === 0
              ? 'Gostei da publicacao, vou acompanhar por aqui.'
              : 'Boa dica para quem esta procurando isso na regiao.',
          createdAt: hoursAgo(1 + postIndex + commentIndex),
          updatedAt: hoursAgo(1 + postIndex + commentIndex),
        },
      });
    }

    if (postIndex % 3 === 0 && reactors[0]) {
      await prisma.postShare.create({
        data: {
          postId: post.id,
          userId: reactors[0].id,
          target: 'seed',
          createdAt: hoursAgo(2 + postIndex),
        },
      });
    }
  }
}

async function createFollowsAndStories(usersByEmail: Map<string, { id: string }>) {
  const allEmails = [...regularUsers, ...businessUsers].map((user) => user.email);
  const users = allEmails
    .map((email) => ({ email, user: usersByEmail.get(email) }))
    .filter((item): item is { email: string; user: { id: string } } => Boolean(item.user));

  for (const [index, item] of users.entries()) {
    const following = [users[(index + 1) % users.length], users[(index + 3) % users.length]];

    for (const target of following) {
      if (target.user.id === item.user.id) continue;

      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: item.user.id,
            followingId: target.user.id,
          },
        },
        update: {},
        create: {
          followerId: item.user.id,
          followingId: target.user.id,
          createdAt: hoursAgo(90 - index),
        },
      });
    }
  }

  const storyAuthors = [
    'ana.souza@palmital.test',
    'mariana.silva@palmital.test',
    'ricardo.melo@palmital.test',
    'juliana.ribeiro@palmital.test',
    'leonardo.ferrari@palmital.test',
  ];

  for (const [index, email] of storyAuthors.entries()) {
    const author = usersByEmail.get(email);
    if (!author) continue;

    const createdAt = hoursAgo(1 + index * 3);
    const expiresAt = new Date(createdAt);
    expiresAt.setHours(expiresAt.getHours() + 24);

    const media = await prisma.media.create({
      data: {
        uploaderId: author.id,
        url: imageUrl(`story-${email}-${index}`, 1080, 1920),
        type: MediaType.IMAGE,
        mimeType: 'image/jpeg',
        sizeBytes: 220000 + index * 8000,
        width: 1080,
        height: 1920,
        createdAt,
      },
    });

    await prisma.story.create({
      data: {
        authorId: author.id,
        mediaId: media.id,
        caption:
          index % 2 === 0
            ? 'Atualizacao rapida do dia para quem acompanha o perfil.'
            : 'Bastidores em formato vertical, disponivel por 24 horas.',
        createdAt,
        updatedAt: createdAt,
        expiresAt,
      },
    });
  }
}

async function createConversations(usersByEmail: Map<string, { id: string }>) {
  for (const seed of buildConversationSeeds()) {
    const userIds = seed.participants.map((email) => {
      const user = usersByEmail.get(email);
      if (!user) throw new Error(`Conversation participant not found for ${email}`);
      return user.id;
    });

    const conversation = await prisma.conversation.create({
      data: {
        createdAt: seed.messages[0]?.createdAt ?? new Date(),
        updatedAt: seed.messages[seed.messages.length - 1]?.createdAt ?? new Date(),
        participants: {
          create: seed.participants.map((email, index) => ({
            userId: userIds[index],
            joinedAt: seed.messages[0]?.createdAt ?? new Date(),
            lastReadAt: seed.lastReadAt?.[email] ?? null,
          })),
        },
      },
    });

    for (const message of seed.messages) {
      const sender = usersByEmail.get(message.senderEmail);
      if (!sender) throw new Error(`Message sender not found for ${message.senderEmail}`);

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: sender.id,
          content: message.content,
          status: message.status,
          createdAt: message.createdAt,
        },
      });
    }
  }
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123456';
  const testPassword = process.env.SEED_TEST_PASSWORD ?? 'Teste123456';

  await cleanupSeedNamespace();
  const categoryIds = await ensureCategories();
  await ensureAdmin(adminPassword);
  const { usersByEmail, companiesBySlug, productsByCompanySlug } = await createUsers(testPassword);
  await createPostsAndClassifieds(
    usersByEmail,
    companiesBySlug,
    productsByCompanySlug,
    categoryIds,
  );
  await createPostInteractions(usersByEmail);
  await createFollowsAndStories(usersByEmail);
  await createConversations(usersByEmail);

  // Extra seeds: delivery, news, more products and orders
  const customerIds = regularUsers
    .map(u => usersByEmail.get(u.email)?.id)
    .filter((id): id is string => Boolean(id));
  await runExtraSeeds(testPassword, companiesBySlug, customerIds, prisma);

  const classifiedEntries = classifiedCatalog.reduce(
    (total, group) => total + group.items.length,
    0,
  );
  const activeClassifieds = Array.from({ length: classifiedEntries }).filter(
    (_, index) => statusForClassified(index) === ClassifiedStatus.ACTIVE,
  ).length;

  console.log('Seed completed with realistic test data.');
  console.log(`Categories: ${Object.keys(categoryIds).length}`);
  console.log(`Users: ${1 + regularUsers.length + businessUsers.length}`);
  console.log(`Companies: ${businessUsers.length}`);
  console.log(
    `Products: ${businessUsers.reduce((sum, user) => sum + user.company.products.length, 0)}`,
  );
  console.log(
    `Feed posts: ${socialPosts.length + businessPosts.length + promotionPosts.length + classifiedEntries}`,
  );
  console.log(`Classifieds: ${classifiedEntries} (${activeClassifieds} active)`);
  console.log(`Promotions: ${promotionPosts.length}`);
  console.log('Post interactions: seeded reactions, comments and shares for recent posts');
  console.log('Follows and stories: seeded follower graph and active 9:16 stories');
  console.log(`Conversations: ${buildConversationSeeds().length}`);

  console.table([
    { profile: 'Admin', email: ADMIN_EMAIL, password: adminPassword, role: UserRole.ADMIN },
    ...regularUsers.map((user) => ({
      profile: user.displayName,
      email: user.email,
      password: testPassword,
      role: UserRole.USER,
    })),
    ...businessUsers.map((user) => ({
      profile: user.displayName,
      email: user.email,
      password: testPassword,
      role: UserRole.BUSINESS_OWNER,
    })),
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
