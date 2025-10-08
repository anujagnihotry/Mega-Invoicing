
'use client';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, FileText } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/hooks/use-app';
import Image from 'next/image';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  
  const AppLogo = () => (
    <>
      {settings.appLogo ? (
        <Image src={settings.appLogo} alt={settings.appName} width={24} height={24} className="h-6 w-6" />
      ) : (
        <FileText className="h-6 w-6 text-primary" />
      )}
      <span>{settings.appName}</span>
    </>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <AppLogo />
          </Link>
        </div>
        <MainNav isCollapsed={false} />
      </aside>
      <div className="flex flex-col sm:pl-56">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
           <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-16 items-center border-b px-4">
                  <Link href="/" className="flex items-center gap-2 font-semibold">
                    <AppLogo />
                  </Link>
                </div>
                <MainNav isCollapsed={false} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}
