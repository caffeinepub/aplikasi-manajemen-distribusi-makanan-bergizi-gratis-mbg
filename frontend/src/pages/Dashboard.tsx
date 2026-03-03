import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import Header from '../components/Header';
import DashboardHome from '../components/DashboardHome';
import SasaranPage from '../components/SasaranPage';
import PaketPage from '../components/PaketPage';
import DistribusiPage from '../components/DistribusiPage';
import LaporanPage from '../components/LaporanPage';

export type MenuType = 'home' | 'sasaran' | 'paket' | 'distribusi' | 'laporan';

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState<MenuType>('home');
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  // Get user name from principal (simplified display)
  const userName = identity?.getPrincipal().toString().slice(0, 8) + '...';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <Header
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        userName={userName}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        {activeMenu === 'home' && <DashboardHome setActiveMenu={setActiveMenu} />}
        {activeMenu === 'sasaran' && <SasaranPage />}
        {activeMenu === 'paket' && <PaketPage />}
        {activeMenu === 'distribusi' && <DistribusiPage />}
        {activeMenu === 'laporan' && <LaporanPage />}
      </main>

      <footer className="border-t bg-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025. Dibuat dengan ❤️ menggunakan <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">caffeine.ai</a></p>
        </div>
      </footer>
    </div>
  );
}
