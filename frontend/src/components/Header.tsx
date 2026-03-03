import { Button } from '@/components/ui/button';
import { LogOut, Home, Users, Package, Truck, FileText } from 'lucide-react';
import type { MenuType } from '../pages/Dashboard';

interface HeaderProps {
  activeMenu: MenuType;
  setActiveMenu: (menu: MenuType) => void;
  userName: string | undefined;
  onLogout: () => void;
}

export default function Header({ activeMenu, setActiveMenu, userName, onLogout }: HeaderProps) {
  const menuItems = [
    { id: 'home' as MenuType, label: 'Beranda', icon: Home },
    { id: 'sasaran' as MenuType, label: 'Data Sasaran', icon: Users },
    { id: 'paket' as MenuType, label: 'Data Paket', icon: Package },
    { id: 'distribusi' as MenuType, label: 'Distribusi', icon: Truck },
    { id: 'laporan' as MenuType, label: 'Laporan', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/dashboard-icon-transparent.dim_64x64.png"
              alt="Logo"
              className="h-10 w-10"
            />
            <div>
              <h1 className="text-lg font-bold text-emerald-900">Sistem MBG</h1>
              <p className="text-xs text-emerald-700">Kecamatan Cisalak</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeMenu === item.id ? 'default' : 'ghost'}
                  onClick={() => setActiveMenu(item.id)}
                  className={activeMenu === item.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            {userName && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{userName}</p>
              </div>
            )}
            <Button variant="outline" onClick={onLogout} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex md:hidden gap-1 overflow-x-auto pb-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeMenu === item.id ? 'default' : 'ghost'}
                onClick={() => setActiveMenu(item.id)}
                size="sm"
                className={activeMenu === item.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
