import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { ToastContainer } from '../shared/Toast';
import { CompanyCartDrawer } from '../shared/CompanyCartDrawer';
import { useAuthStore } from '../../store/authStore';
import { connectSocket, disconnectSocket } from '../../services/socket';

export function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { pathname } = useLocation();
  const isProfileRoute = pathname === '/profile' || pathname.startsWith('/profile/');
  const isCompanyRoute = pathname === '/companies/manage' || pathname.startsWith('/companies/');

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [accessToken, isAuthenticated]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas text-ink">
      {/* Halos ambientais — manchas de cor desfocadas no fundo */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full opacity-[0.18] blur-[120px] dark:opacity-[0.25]"
          style={{ background: '#FF5B49' }}
        />
        <div
          className="absolute right-[-10rem] top-[28%] h-[26rem] w-[26rem] rounded-full opacity-[0.14] blur-[120px] dark:opacity-[0.20]"
          style={{ background: '#3D5AFE' }}
        />
        <div
          className="absolute -bottom-32 left-[30%] h-[24rem] w-[24rem] rounded-full opacity-[0.12] blur-[120px] dark:opacity-[0.18]"
          style={{ background: '#5EEAD4' }}
        />
        <div
          className="absolute right-[15%] bottom-[10%] h-[20rem] w-[20rem] rounded-full opacity-[0.10] blur-[120px] dark:opacity-[0.16]"
          style={{ background: '#E94FCB' }}
        />
      </div>

      <TopBar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 pt-20">
        <div className="w-full px-4 pb-32 pt-2 lg:px-6 lg:pb-10 lg:pt-4">
          <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-8">
            <aside className="glass-scrollbar hidden lg:sticky lg:top-24 lg:block lg:h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1">
              <DesktopSidebar />
            </aside>

            <section className="min-w-0">
              <div
                className={`mx-auto w-full ${
                  isProfileRoute || isCompanyRoute ? 'max-w-[72rem]' : 'max-w-[60rem]'
                }`}
              >
                <Outlet />
              </div>
            </section>
          </div>
        </div>
      </main>

      <BottomNav />
      <CompanyCartDrawer />
      <ToastContainer />
    </div>
  );
}
