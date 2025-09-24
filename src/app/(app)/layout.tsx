import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, FileText } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileText className="h-6 w-6 text-primary" />
            <span>{APP_NAME}</span>
          </Link>
        </div>
        <MainNav isCollapsed={false} />
      </aside>
      <div className="flex flex-col sm:pl-56">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 no-print">
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
                    <FileText className="h-6 w-6 text-primary" />
                    <span>{APP_NAME}</span>
                  </Link>
                </div>
                <MainNav isCollapsed={false} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="ml-auto flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
