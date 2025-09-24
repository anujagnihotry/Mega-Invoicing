import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/components/providers/app-provider';
import AppLayout from '@/app/(app)/layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SwiftInvoice',
  description: 'SaaS Invoicing Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if we are on a print route
  // This is a bit of a hack, but it's the most reliable way to do this
  // with the current Next.js App Router limitations.
  const isPrintPage = (children as any)?.props?.childProp?.segment === 'print';
  const isActivatePage = (children as any)?.props?.childProp?.segment === 'activate';

  if (isPrintPage) {
    return (
       <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <AppProvider>
            <main className="p-4 sm:px-6 sm:py-0">{children}</main>
          </AppProvider>
        </body>
      </html>
    )
  }

  if(isActivatePage) {
     return (
       <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </body>
      </html>
    )
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
