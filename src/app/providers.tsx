'use client';

import { AppProvider } from '@/components/providers/app-provider';
import { FirebaseClientProvider } from '@/firebase';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppProvider>{children}</AppProvider>
    </FirebaseClientProvider>
  );
}
