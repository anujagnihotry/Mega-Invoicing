
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, Settings, Warehouse, ShoppingCart, Ruler, History, Users, Truck, Folder, Package } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

export function MainNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/',
    },
    {
      href: '/invoices',
      label: 'Invoices',
      icon: FileText,
      isActive: pathname.startsWith('/invoices'),
    },
    {
        href: '/units',
        label: 'Units',
        icon: Ruler,
        isActive: pathname.startsWith('/units'),
    },
    {
        href: '/categories',
        label: 'Categories',
        icon: Folder,
        isActive: pathname.startsWith('/categories'),
    },
    {
      href: '/inventory',
      label: 'Product Master',
      icon: Package,
      isActive: pathname === '/inventory',
    },
    {
        href: '/inventory/item-tracking',
        label: 'Item Tracking',
        icon: History,
        isActive: pathname === '/inventory/item-tracking',
    },
    {
      href: '/purchases',
      label: 'Purchase Orders',
      icon: ShoppingCart,
      isActive: pathname.startsWith('/purchases'),
    },
    {
      href: '/purchase-entries',
      label: 'Purchase Entries',
      icon: Truck,
      isActive: pathname.startsWith('/purchase-entries'),
    },
     {
      href: '/suppliers',
      label: 'Suppliers',
      icon: Users,
      isActive: pathname.startsWith('/suppliers'),
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  return (
    <nav className="flex flex-col items-start gap-2 px-2 py-4">
      <TooltipProvider>
        {navItems.map((item) => (
          <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full',
                  item.isActive && 'bg-muted text-primary',
                  isCollapsed && 'justify-center'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className={cn('truncate', isCollapsed && 'hidden')}>{item.label}</span>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </TooltipProvider>
    </nav>
  );
}
