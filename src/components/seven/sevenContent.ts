import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Compass,
  Factory,
  GraduationCap,
  Handshake,
  LineChart,
  LucideIcon,
  MapPinned,
  Megaphone,
  Orbit,
  Palette,
  PenTool,
  Presentation,
  Radar,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Waypoints,
} from 'lucide-react';

export const sevenAssets = {
  logo: '/assets/seven/Logo%20Seven%20Group.webp',
  logoN: '/assets/seven/Logo%20N.webp',
  gilson: '/assets/seven/gilson.webp',
  alex: '/assets/seven/alex.webp',
  rafael: '/assets/seven/rafael.webp',
  victor: '/assets/seven/victor.webp',
  otavio: '/assets/seven/otavio.webp',
  gabriel: '/assets/seven/gabriel.webp',
  brenda: '/assets/seven/brenda.webp',
};

export interface IconItem {
  title: string;
  description?: string;
  icon: LucideIcon;
}

export const expertise: IconItem[] = [
  { title: 'Estratégia imobiliária', icon: Compass },
  { title: 'Posicionamento de empreendimentos', icon: Target },
  { title: 'Desenvolvimento imobiliário', icon: Building2 },
  { title: 'Marketing imobiliário', icon: Megaphone },
  { title: 'Arquitetura estratégica', icon: PenTool },
  { title: 'Render e apresentação visual', icon: Palette },
  { title: 'Mobilização de mercado', icon: Orbit },
  { title: 'Suporte comercial', icon: Handshake },
  { title: 'Treinamento de equipes', icon: GraduationCap },
  { title: 'Aceleração de vendas', icon: LineChart },
];

export const ethics = [
  'Ética',
  'Transparência',
  'Respeito ao mercado',
  'Responsabilidade com parceiros',
  'Compromisso com a verdade',
];

export const leaders = [
  {
    name: 'Gilson Nogueira',
    role: 'Fundador e CEO',
    initials: 'GN',
    image: sevenAssets.gilson,
    intro:
      'Gilson iniciou sua trajetória muito jovem no mercado imobiliário, assumindo aos 21 anos a diretoria geral de uma imobiliária especializada em lançamentos no interior de São Paulo.',
    body:
      'Em 2019, fundou a Seven Group com o objetivo de criar um ecossistema completo de estratégia, inteligência de mercado, vendas, marketing, performance comercial e aceleração imobiliária.',
    highlight: 'Hoje lidera a expansão estratégica da Seven Group no Brasil.',
    capabilities: [
      'Técnico em Transações Imobiliárias',
      'Perito Imobiliário',
      'Administração de Empresas',
      'MBA em Marketing e Processos - FGV',
      'Gestão de Pessoas e Negociação Avançada - FGV',
      'Designer de interiores e paisagista',
      'Formação internacional com Tony Robbins',
    ],
    icon: ShieldCheck,
  },
  {
    name: 'Alexsander Almeida',
    role: 'Diretor Operacional',
    initials: 'AX',
    image: sevenAssets.alex,
    intro:
      'Responsável pelo direcionamento operacional e integração estratégica dos processos internos da Seven Group.',
    body:
      'Seu papel é garantir alinhamento, eficiência e execução dentro do ecossistema estratégico da Seven.',
    highlight: 'Operação, eficiência e integração em cada frente do grupo.',
    capabilities: [
      'Estruturação de fluxos operacionais',
      'Organização interna dos processos',
      'Acompanhamento da execução estratégica',
      'Integração entre setores e operações',
      'Desenvolvimento organizacional',
    ],
    icon: Waypoints,
  },
  {
    name: 'Rafael Souza',
    role: 'Arquiteto | Marketing & Render',
    initials: 'RS',
    image: sevenAssets.rafael,
    intro:
      'Responsável pela gestão dos setores de marketing e renderização da Seven Group.',
    body:
      'Seu trabalho conecta arquitetura, percepção de valor e comunicação estratégica.',
    highlight: 'Arquitetura, marketing e renderização atuando como uma única narrativa.',
    capabilities: [
      'Direcionamento criativo dos projetos',
      'Gestão de marketing imobiliário',
      'Coordenação de renderizações e apresentações visuais',
      'Delegação estratégica de demandas',
      'Acompanhamento dos processos de aprovação',
      'Comunicação entre equipe, clientes e operação interna/externa',
    ],
    icon: Presentation,
  },
];

export const creativeTeam = [
  {
    name: 'Victor, Otávio e Gabriel',
    role: 'Designers Gráficos',
    initials: 'VOG',
    images: [sevenAssets.victor, sevenAssets.otavio, sevenAssets.gabriel],
    description:
      'Desenvolvimento visual, direção criativa, campanhas publicitárias, materiais institucionais e comerciais, posicionamento visual estratégico e apresentações da marca.',
    icon: Palette,
  },
  {
    name: 'Brenda',
    role: 'Creator Content | Social Media',
    initials: 'BR',
    images: [sevenAssets.brenda],
    description:
      'Redes sociais, planejamento de conteúdo, estratégia de comunicação digital, produção criativa e fortalecimento da presença institucional da marca.',
    icon: Sparkles,
  },
];

export const ecosystemSteps: IconItem[] = [
  { title: 'Pesquisa', description: 'Leitura de mercado e demanda real.', icon: Radar },
  { title: 'Estratégia', description: 'Posicionamento e inteligência comercial.', icon: Compass },
  { title: 'Arquitetura', description: 'Produto com percepção de valor.', icon: PenTool },
  { title: 'Render', description: 'Apresentação visual de alto impacto.', icon: Palette },
  { title: 'Marketing', description: 'Comunicação integrada do empreendimento.', icon: Megaphone },
  { title: 'Tráfego', description: 'Leads qualificados e performance digital.', icon: BarChart3 },
  { title: 'Comercial', description: 'Mobilização, CRM e gestão de vendas.', icon: BriefcaseBusiness },
  { title: 'Treinamento', description: 'Cultura de alta performance.', icon: GraduationCap },
];

export const painPoints = [
  { pain: 'Decisões sem dados', answer: 'Pesquisa, diagnóstico regional e inteligência aplicada.' },
  { pain: 'Material publicitário pouco atrativo', answer: 'Branding, direção criativa e comunicação de valor.' },
  { pain: 'Arquitetura pouco vendável', answer: 'Produto pensado para desejo, uso e velocidade comercial.' },
  { pain: 'Comunicação ineficiente', answer: 'Narrativa clara, campanha integrada e posicionamento.' },
  { pain: 'Operação comercial frágil', answer: 'Gestão, treinamento e acompanhamento de performance.' },
  { pain: 'Render amador', answer: 'Renderização estratégica e apresentação visual premium.' },
];

export const pillars = [
  {
    number: '01',
    title: 'Pesquisa de Mercado',
    icon: Radar,
    description:
      'Levantamento qualitativo e quantitativo para análise de viabilidade, público-alvo, concorrência, elasticidade de preço e comportamento do comprador.',
    deliveries: ['Mapeamento competitivo', 'Diagnóstico regional', 'Estudos de demanda', 'Inteligência de mercado'],
  },
  {
    number: '02',
    title: 'Estratégia Comercial',
    icon: Target,
    description: 'Desenvolvimento do posicionamento do produto e definição estratégica de mercado.',
    deliveries: ['Posicionamento do empreendimento', 'Precificação', 'Estratégia comercial', 'Dinâmica de tabelas', 'Planejamento de lançamento', 'Estrutura de vendas'],
  },
  {
    number: '03',
    title: 'Gestão de Vendas',
    icon: BriefcaseBusiness,
    description: 'Execução e acompanhamento da operação comercial.',
    deliveries: ['Gestão comercial do produto', 'Relacionamento com imobiliárias', 'Atendimento junto aos corretores', 'Mobilização de equipes', 'Performance comercial'],
  },
  {
    number: '04',
    title: 'Apresentação Visual',
    icon: Presentation,
    description: 'Construção da percepção estética e comercial do empreendimento.',
    deliveries: ['Perspectivas 3D', 'Plantas humanizadas', 'Vídeos', 'Tours virtuais', 'Renderização estratégica', 'Materiais institucionais'],
  },
  {
    number: '05',
    title: 'Marketing e Propaganda',
    icon: Megaphone,
    description: 'Desenvolvimento da comunicação integrada do empreendimento.',
    deliveries: ['Branding', 'Campanhas online e offline', 'Conceito criativo', 'Posicionamento visual', 'Direcionamento de comunicação'],
  },
  {
    number: '06',
    title: 'Tráfego Pago',
    icon: CircleDollarSign,
    description: 'Estratégia de mídia e performance digital.',
    deliveries: ['Captação de leads qualificados', 'Gestão de campanhas', 'Segmentação de público', 'Otimização de ROI', 'Performance comercial'],
  },
  {
    number: '07',
    title: 'Escola de Vendas',
    icon: GraduationCap,
    description: 'Capacitação contínua das equipes comerciais.',
    deliveries: ['Treinamentos estratégicos', 'Desenvolvimento comercial', 'Capacitação de equipes próprias e terceiras', 'Cultura de alta performance'],
  },
];

export const differentials: IconItem[] = [
  { title: 'Inteligência de mercado real', description: 'Diagnóstico de viabilidade baseado em dados concretos.', icon: Radar },
  { title: 'Integração total das áreas', description: 'Arquitetura, marketing e comercial conectados desde o início.', icon: Waypoints },
  { title: 'Estrutura própria', description: 'Time interno de tráfego, criação, comercial, CRM e estratégia.', icon: Factory },
  { title: 'Metodologia validada', description: 'Modelo aplicado em mais de 250 empreendimentos.', icon: BadgeCheck },
  { title: 'Velocidade comercial', description: 'Empreendimentos vendidos em horas, não em meses.', icon: LineChart },
];

export const focusAreas = [
  'Incorporações residenciais',
  'Incorporações comerciais',
  'Condomínios',
  'Loteamentos',
  'Condo-hotéis',
  'Urbanizações',
];

export const specialties = [
  'Estruturação de novos projetos',
  'Recuperação de produtos que não performaram',
  'Desenvolvimento estratégico',
  'Execução comercial completa',
];

export const cityCommitments: IconItem[] = [
  { title: 'Elevar o nível estratégico dos lançamentos', icon: LineChart },
  { title: 'Organizar o mercado de vendas', icon: ScrollText },
  { title: 'Gerar oportunidades para corretores', icon: Users },
  { title: 'Criar projetos valorizados', icon: Building2 },
  { title: 'Fortalecer o mercado imobiliário da cidade', icon: MapPinned },
];

export const navItems = [
  { href: '#quem-somos', label: 'Quem somos' },
  { href: '#estrutura', label: 'Estrutura' },
  { href: '#lideranca', label: 'Liderança' },
  { href: '#pilares', label: 'Pilares' },
  { href: '#compromisso', label: 'Compromisso' },
];

export const manifesto =
  'Não participamos de práticas que comprometam a integridade do mercado. Preferimos abrir mão de qualquer negócio a comprometer aquilo que mais valorizamos: nossa reputação.';

export const addresses = [
  'Dourados/MS - Rua Josephine Abboud Saad, 1875 - Jardim das Palmeiras',
  'Santa Maria/RS - Rua Duque de Caxias, 2357 - Ed. Del Vale Center, Sala 104',
];
