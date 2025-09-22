'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { VALID_LICENSE_KEY, APP_NAME } from '@/lib/constants';
import { KeyRound, FileText } from 'lucide-react';

export default function ActivatePage() {
  const [key, setKey] = useState('');
  const { setLicenseKey } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleActivation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (key === VALID_LICENSE_KEY) {
        setLicenseKey(key);
        toast({
          title: 'Success!',
          description: 'Your license has been activated.',
        });
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Activation Failed',
          description: 'The license key you entered is invalid. Please try again.',
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
       <div className="absolute top-8 left-8 flex items-center gap-2 text-2xl font-bold text-foreground">
          <FileText className="h-8 w-8 text-primary" />
          <span>{APP_NAME}</span>
        </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Activate Your License</CardTitle>
          <CardDescription>Enter your license key to start using {APP_NAME}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivation} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="license-key">License Key</Label>
              <Input
                id="license-key"
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
                className="text-center tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Activating...
                </>
              ) : (
                'Activate'
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Don't have a license key? Contact support to get one.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
