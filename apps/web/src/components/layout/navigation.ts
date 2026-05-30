import {
  Building2,
  Car,
  Grid2x2,
  Home,
  MessageCircle,
  Newspaper,
  PlusCircle,
  ShoppingBag,
  User,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

interface AppNavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  mobile?: boolean;
  primary?: boolean;
}

export const appNavItems: AppNavItem[] = [
  { to: '/feed', icon: Home, label: 'Feed', mobile: true },
  { to: '/services', icon: Grid2x2, label: 'Serviços', mobile: true },
  { to: '/create', icon: PlusCircle, label: 'Publicar', primary: true, mobile: true },
  { to: '/chat', icon: MessageCircle, label: 'Chat', mobile: true },
  { to: '/profile', icon: User, label: 'Perfil', mobile: true },

  // Services in desktop sidebar (not mobile)
  { to: '/rides', icon: Car, label: 'Mobilidade', mobile: false },
  { to: '/delivery', icon: UtensilsCrossed, label: 'Delivery', mobile: false },
  { to: '/news', icon: Newspaper, label: 'Notícias', mobile: false },
  { to: '/classifieds', icon: ShoppingBag, label: 'Mercado', mobile: false },
  { to: '/companies', icon: Building2, label: 'Empresas', mobile: false },
];

export const mobileNavItems = appNavItems.filter((item) => item.mobile);
export const desktopNavItems = appNavItems.filter((item) => !item.primary);

export function isNavItemActive(pathname: string, to: string) {
  if (to === '/profile') {
    return pathname === '/profile' || pathname.startsWith('/profile/');
  }
  if (to === '/chat') {
    return pathname === '/chat' || pathname.startsWith('/chat/');
  }
  if (to === '/classifieds') {
    return pathname === '/classifieds' || pathname.startsWith('/classifieds/');
  }
  if (to === '/companies') {
    return pathname === '/companies' || pathname.startsWith('/companies/');
  }
  if (to === '/rides') {
    return pathname === '/rides' || pathname.startsWith('/rides/');
  }
  if (to === '/delivery') {
    return pathname === '/delivery' || pathname.startsWith('/delivery/');
  }
  if (to === '/news') {
    return pathname === '/news' || pathname.startsWith('/news/');
  }
  if (to === '/services') {
    return pathname === '/services';
  }
  return pathname === to;
}
