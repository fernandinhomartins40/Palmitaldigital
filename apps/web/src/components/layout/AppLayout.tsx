import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { ToastContainer } from '../shared/Toast';

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar />
      <main className="flex-1 overflow-y-auto pt-14 pb-16 max-w-lg mx-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
