import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <img
            src="/assets/generated/government-building.dim_800x400.jpg"
            alt="Gedung Pemerintahan"
            className="mx-auto mb-6 h-32 w-64 rounded-lg object-cover shadow-lg"
          />
          <h1 className="mb-2 text-4xl font-bold text-emerald-900">
            Sistem Manajemen MBG
          </h1>
          <p className="text-lg text-emerald-700">
            Kecamatan Cisalak
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Selamat Datang</CardTitle>
            <CardDescription>
              Aplikasi Manajemen Distribusi Makanan Bergizi Gratis untuk Penerima Manfaat B3
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-sm text-emerald-800">
                Silakan login untuk mengakses sistem manajemen distribusi MBG.
              </p>
            </div>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses Login...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Login dengan Internet Identity
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2025. Dibuat dengan ❤️ menggunakan <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">caffeine.ai</a></p>
        </footer>
      </div>
    </div>
  );
}
