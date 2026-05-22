import {
  BadgeCheck,
  Building2,
  CircleDot,
  Compass,
  Diamond,
  Eye,
  Gem,
  Layers3,
  LineChart,
  LucideIcon,
  Map,
  MessagesSquare,
  PenLine,
  Radar,
  Route,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';

export const arqoAssets = {
  logo: '/assets/arqo/Logo%20Preferencial%20%E2%80%A2%20Arqo.webp',
  logoWhite: '/assets/arqo/Logo%20Preferencial%20BRANCO%20%E2%80%A2%20Arqo.webp',
  icon: '/assets/arqo/%C3%8Dcone%20Q%20Arqo.webp',
};

export const arqoNavItems = [
  { href: '#manifesto', label: 'Manifesto' },
  { href: '#conceito', label: 'Conceito' },
  { href: '#jornada', label: 'Jornada' },
  { href: '#curadoria', label: 'Curadoria' },
  { href: '#metodo', label: 'Método' },
  { href: '#estruturas', label: 'Estruturas' },
  { href: '#essencia', label: 'Essência' },
];

export interface ArqoIconItem {
  title: string;
  description?: string;
  icon: LucideIcon;
}

export const profileItems: ArqoIconItem[] = [
  { title: 'Objetivos', icon: Target },
  { title: 'Momento de vida', icon: CircleDot },
  { title: 'Perfil financeiro', icon: LineChart },
  { title: 'Visão de futuro', icon: Compass },
  { title: 'Estilo de investimento', icon: ScanLine },
  { title: 'Prioridades reais', icon: Diamond },
];

export const investorJourney = [
  {
    title: 'Entendimento',
    description: 'Antes de qualquer oportunidade, a ARQO escuta contexto, intenção e momento de vida.',
    icon: Eye,
  },
  {
    title: 'Diagnóstico',
    description: 'Transformamos informações dispersas em leitura estratégica do perfil investidor.',
    icon: Radar,
  },
  {
    title: 'Curadoria',
    description: 'O excesso sai de cena. Permanecem apenas possibilidades coerentes.',
    icon: Gem,
  },
  {
    title: 'Direcionamento',
    description: 'Cada opção ganha critério, comparação e consequência clara.',
    icon: Compass,
  },
  {
    title: 'Segurança',
    description: 'A decisão passa a ter lógica, lastro e tranquilidade.',
    icon: ShieldCheck,
  },
  {
    title: 'Decisão',
    description: 'O imóvel deixa de ser uma aposta e passa a ser uma escolha estruturada.',
    icon: Target,
  },
];

export const strategicStructures = [
  {
    number: '01',
    title: 'Posicionamento',
    description: 'Definição clara de público, proposta de valor e território de marca.',
    icon: Target,
  },
  {
    number: '02',
    title: 'Identidade de Marca',
    description: 'Construção de nome, linguagem, estética e personalidade do produto.',
    icon: PenLine,
  },
  {
    number: '03',
    title: 'Experiência do Cliente',
    description: 'Desenho da jornada completa, desde o primeiro contato até o pós-compra.',
    icon: Route,
  },
  {
    number: '04',
    title: 'Construção de Desejo',
    description: 'Uso de narrativa, percepção e emoção para elevar valor percebido.',
    icon: Sparkles,
  },
  {
    number: '05',
    title: 'Consistência de Comunicação',
    description: 'Alinhamento total entre todos os pontos de contato com o cliente.',
    icon: MessagesSquare,
  },
];

export const thinkingPoints = [
  'Cada produto precisa de um território claro.',
  'A marca precisa ser coerente em todos os pontos.',
  'A experiência define o valor percebido.',
  'A narrativa conduz a decisão do cliente.',
  'Nada é construído no improviso. Tudo comunica.',
];

export const deliverables: ArqoIconItem[] = [
  { title: 'Posicionamento claro', icon: Target },
  { title: 'Identidade consistente', icon: BadgeCheck },
  { title: 'Experiência estruturada', icon: Layers3 },
  { title: 'Percepção de valor elevada', icon: Eye },
  { title: 'Organização estratégica das escolhas', icon: Map },
  { title: 'Curadoria de oportunidades', icon: Gem },
  { title: 'Direcionamento imobiliário', icon: Compass },
  { title: 'Clareza no processo decisório', icon: ShieldCheck },
];

export const differentialWords = [
  'Segurança',
  'Direção',
  'Percepção de valor',
  'Visão de futuro',
  'Tranquilidade na decisão',
];

export const cultureItems: ArqoIconItem[] = [
  { title: 'Clareza', icon: Eye },
  { title: 'Critério', icon: Radar },
  { title: 'Postura', icon: Building2 },
  { title: 'Elegância', icon: Diamond },
  { title: 'Estratégia', icon: Target },
  { title: 'Direção', icon: Compass },
];
