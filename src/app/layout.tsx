import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/components/providers/app-provider';
import AppLayout from '@/app/(app)/layout';
import PrintLayout from './print-layout';

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
  // This is a hacky way to check the route segment, but necessary
  // given the limitations of layouts in the Next.js App Router.
  // We inspect the props of the children to determine the page's segment.
  const segment = (children as any)?.props?.childProp?.segment;

  if (segment === 'print') {
    return (
      <PrintLayout>
        {children}
      </PrintLayout>
    );
  }

  if (segment === 'activate') {
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
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
