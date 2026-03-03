import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetStatistikDistribusi } from '../hooks/useQueries';
import { Users, Package, Truck, TrendingUp, ArrowRight } from 'lucide-react';
import type { MenuType } from '../pages/Dashboard';

interface DashboardHomeProps {
  setActiveMenu: (menu: MenuType) => void;
}

export default function DashboardHome({ setActiveMenu }: DashboardHomeProps) {
  const { data: stats, isLoading } = useGetStatistikDistribusi();

  const statCards = [
    {
      title: 'Total Sasaran',
      value: stats?.totalSasaran.toString() || '0',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Penerima manfaat terdaftar',
    },
    {
      title: 'Total Paket',
      value: stats?.totalPaket.toString() || '0',
      icon: Package,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Jenis paket tersedia',
    },
    {
      title: 'Total Distribusi',
      value: stats?.totalDistribusi.toString() || '0',
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Distribusi tercatat',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Logo Section */}
      <div className="flex flex-col items-center justify-center space-y-4 py-6">
        <img 
          src="/assets/Untitled-1.png" 
          alt="Logo UPTD DALDUK PKK - DP2KBP3A" 
          className="w-40 h-40 md:w-48 md:h-48 object-contain"
        />
        <div className="text-center space-y-1">
          <h1 className="text-lg md:text-xl font-bold text-emerald-900">
            UPTD DALDUK PKK - DP2KBP3A Kecamatan Cisalak
          </h1>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-emerald-900 mb-2">
          Dashboard Sistem MBG
        </h2>
        <p className="text-muted-foreground">
          Manajemen Distribusi Makanan Bergizi Gratis - Kecamatan Cisalak
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? '...' : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img src="/assets/generated/food-distribution.dim_600x400.jpg" alt="Distribusi" className="h-8 w-8 rounded object-cover" />
              Tentang Program MBG
            </CardTitle>
            <CardDescription>
              Program Makanan Bergizi Gratis untuk Penerima Manfaat B3
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sistem ini membantu mengelola dan memantau distribusi makanan bergizi gratis
              kepada penerima manfaat B3 di Kecamatan Cisalak. Dengan sistem yang terstruktur,
              proses distribusi menjadi lebih efisien dan terdata dengan baik.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setActiveMenu('sasaran')} variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Kelola Sasaran
              </Button>
              <Button onClick={() => setActiveMenu('distribusi')} variant="outline" size="sm">
                <Truck className="mr-2 h-4 w-4" />
                Catat Distribusi
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img src="/assets/generated/official-document.dim_400x300.jpg" alt="Laporan" className="h-8 w-8 rounded object-cover" />
              Menu Cepat
            </CardTitle>
            <CardDescription>
              Akses cepat ke fitur-fitur utama
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setActiveMenu('sasaran')}
              variant="ghost"
              className="w-full justify-between hover:bg-emerald-50"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Data Sasaran Penerima
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setActiveMenu('paket')}
              variant="ghost"
              className="w-full justify-between hover:bg-emerald-50"
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Data Paket MBG
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setActiveMenu('distribusi')}
              variant="ghost"
              className="w-full justify-between hover:bg-emerald-50"
            >
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Catat Distribusi
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setActiveMenu('laporan')}
              variant="ghost"
              className="w-full justify-between hover:bg-emerald-50"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Generate Laporan
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
