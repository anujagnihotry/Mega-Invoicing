'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import useLocalStorage from '@/hooks/use-local-storage';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-[width]',
          isCollapsed ? 'w-14' : 'w-56'
        )}
      >
        <div className="flex h-16 items-center border-b px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileText className="h-6 w-6 text-primary" />
            <span className={cn(isCollapsed && 'hidden')}>{APP_NAME}</span>
          </Link>
        </div>
        <MainNav isCollapsed={isCollapsed} />
        <div className="mt-auto flex border-t p-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="rounded-full">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
      <div className={cn('flex flex-col sm:gap-4 sm:py-4 transition-[padding-left]', isCollapsed ? 'sm:pl-14' : 'sm:pl-56')}>
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
                <div className="flex h-16 items-center border-b px-4 lg:px-6">
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
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
