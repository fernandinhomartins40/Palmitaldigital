import { Building2, Home, MessageCircle, PlusCircle, Tag, User, type LucideIcon } from 'lucide-react';

interface AppNavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  mobile?: boolean;
  primary?: boolean;
}

export const appNavItems: AppNavItem[] = [
  { to: '/feed', icon: Home, label: 'Feed', mobile: true },
  { to: '/classifieds', icon: Tag, label: 'Classificados', mobile: true },
  { to: '/companies', icon: Building2, label: 'Empresas', mobile: false },
  { to: '/create', icon: PlusCircle, label: 'Publicar', primary: true, mobile: true },
  { to: '/chat', icon: MessageCircle, label: 'Chat', mobile: true },
  { to: '/profile', icon: User, label: 'Perfil', mobile: true },
] ;

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

  return pathname === to;
}
