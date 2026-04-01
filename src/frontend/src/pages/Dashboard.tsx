import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import DashboardHome from "../components/DashboardHome";
import DistribusiPage from "../components/DistribusiPage";
import Header from "../components/Header";
import LaporanPage from "../components/LaporanPage";
import PaketPage from "../components/PaketPage";
import SasaranPage from "../components/SasaranPage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMigrateFromBackend } from "../hooks/useMigrateFromBackend";

export type MenuType = "home" | "sasaran" | "paket" | "distribusi" | "laporan";

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("sasaran");
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  useMigrateFromBackend();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const userName = `${identity?.getPrincipal().toString().slice(0, 8)}...`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <Header
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        userName={userName}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        {activeMenu === "home" && (
          <DashboardHome setActiveMenu={setActiveMenu} />
        )}
        {activeMenu === "sasaran" && <SasaranPage />}
        {activeMenu === "paket" && <PaketPage />}
        {activeMenu === "distribusi" && <DistribusiPage />}
        {activeMenu === "laporan" && <LaporanPage />}
      </main>

      <footer className="border-t bg-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()}. Dibuat dengan ❤️ menggunakan{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
