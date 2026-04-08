import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Home,
  Loader2,
  LogIn,
  LogOut,
  Package,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { MenuType } from "../pages/Dashboard";

interface HeaderProps {
  activeMenu: MenuType;
  setActiveMenu: (menu: MenuType) => void;
  isAdmin: boolean;
  principalShort?: string;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({
  activeMenu,
  setActiveMenu,
  isAdmin,
  principalShort,
  isLoggingIn,
  onLogin,
  onLogout,
}: HeaderProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const menuItems = [
    { id: "home" as MenuType, label: "Beranda", icon: Home },
    { id: "sasaran" as MenuType, label: "Data Sasaran", icon: Users },
    { id: "paket" as MenuType, label: "Data Paket", icon: Package },
    { id: "distribusi" as MenuType, label: "Distribusi", icon: Truck },
    { id: "laporan" as MenuType, label: "Laporan", icon: FileText },
  ];

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    await onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & branding */}
            <div className="flex items-center gap-2">
              <img
                src="/assets/generated/dashboard-icon-transparent.dim_64x64.png"
                alt="Logo"
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-lg font-bold text-emerald-900">
                  Sistem MBG
                </h1>
                <p className="text-xs text-emerald-700">Kecamatan Cisalak</p>
              </div>
            </div>

            {/* Desktop navigation */}
            <nav
              className="hidden md:flex items-center gap-1"
              data-ocid="nav-menu"
            >
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeMenu === item.id ? "default" : "ghost"}
                    onClick={() => setActiveMenu(item.id)}
                    className={
                      activeMenu === item.id
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : ""
                    }
                    data-ocid={`nav-${item.id}`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            {/* Auth section */}
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <>
                  {/* Admin badge + principal */}
                  <div className="hidden sm:flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs"
                      >
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    </div>
                    {principalShort && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {principalShort}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowLogoutDialog(true)}
                    size="sm"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    data-ocid="logout-btn"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-ocid="login-admin-btn"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login Admin
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav
            className="flex md:hidden gap-1 overflow-x-auto pb-2"
            data-ocid="nav-mobile"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeMenu === item.id ? "default" : "ghost"}
                  onClick={() => setActiveMenu(item.id)}
                  size="sm"
                  className={
                    activeMenu === item.id
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : ""
                  }
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-sm" data-ocid="logout-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600" />
              Konfirmasi Keluar
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin keluar dari sesi Admin? Anda tetap bisa
              melihat data tanpa login.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              data-ocid="logout-cancel-btn"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutConfirm}
              data-ocid="logout-confirm-btn"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Ya, Keluar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
