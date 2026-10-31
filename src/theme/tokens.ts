// Paletas esportivas com verde de trilha e laranja de energia, mantendo
// contraste confortável em ambientes externos e durante a corrida.
export interface ThemeTokens {
  mode: 'light' | 'dark';
  background: string;
  backgroundAlt: string;
  surface: string;
  glass: string; // cor de base do vidro (recebe opacidade no componente)
  glassBorder: string;
  glassHighlight: string; // brilho no topo do vidro
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  onPrimary: string;
  border: string;
  success: string;
  danger: string;
  statusBar: 'dark' | 'light';
}
export const lightTheme: ThemeTokens = {
  mode: 'light',
  background: '#EAF3E8',
  backgroundAlt: '#DCEBDD',
  surface: '#F7FBF6',
  glass: '#F4FAF2',
  glassBorder: 'rgba(25, 103, 70, 0.22)',
  glassHighlight: 'rgba(255, 255, 255, 0.82)',
  text: '#173126',
  muted: '#5D7769',
  primary: '#287A4F',
  primarySoft: '#D7E9D6',
  secondary: '#E9652B',
  onPrimary: '#FFFFFF',
  border: 'rgba(25, 103, 70, 0.15)',
  success: '#25845A',
  danger: '#C83D37',
  statusBar: 'dark',
};
export const darkTheme: ThemeTokens = {
  mode: 'dark',
  background: '#101A16',
  backgroundAlt: '#172720',
  surface: '#1B2B23',
  glass: '#1A2A22',
  glassBorder: 'rgba(183, 232, 111, 0.24)',
  glassHighlight: 'rgba(255, 255, 255, 0.09)',
  text: '#F1F7F1',
  muted: '#A5B8AA',
  primary: '#B7E86F',
  primarySoft: 'rgba(183, 232, 111, 0.16)',
  secondary: '#FF9566',
  onPrimary: '#20311C',
  border: 'rgba(255, 255, 255, 0.1)',
  success: '#8BD58B',
  danger: '#FF7168',
  statusBar: 'light',
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };
