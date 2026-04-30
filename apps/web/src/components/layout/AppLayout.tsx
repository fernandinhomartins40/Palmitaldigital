import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { ToastContainer } from '../shared/Toast';
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_32%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_55%,_#f8fafc)]">
      <TopBar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 pt-14">
        <div className="w-full px-4 pb-20 pt-4 lg:px-6 lg:pb-8 lg:pt-6">
          <div className="lg:grid lg:grid-cols-[248px,minmax(0,1fr)] lg:gap-6 xl:gap-8">
            <aside className="hidden lg:block">
              <DesktopSidebar />
            </aside>

            <section className="min-w-0">
              <div
                className={`mx-auto w-full ${
                  isProfileRoute || isCompanyRoute ? 'max-w-[68rem]' : 'max-w-[56rem]'
                }`}
              >
                <Outlet />
              </div>
            </section>
          </div>
        </div>
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
