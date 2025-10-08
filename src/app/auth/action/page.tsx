'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import { AppSettings } from '@/lib/types';
import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';

function PasswordResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    if (mode === 'resetPassword' && oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then(() => {
          setIsValidCode(true);
        })
        .catch((error) => {
          console.error('Invalid password reset code:', error);
          setError('The password reset link is invalid or has expired. Please request a new one.');
        })
        .finally(() => {
          setIsVerifying(false);
        });
    } else {
        setError('Invalid action. Please try again from the beginning.');
        setIsVerifying(false);
    }
  }, [auth, oobCode, mode]);
  

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !isValidCode) return;

    setIsResetting(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);
      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
      setIsResetting(false);
    }
  };
  
  const [settings] = useLocalStorage<AppSettings>('settings', { appName: APP_NAME } as AppSettings);

  const renderContent = () => {
    if (isVerifying) {
        return (
            <div className="text-center text-muted-foreground">
                <p>Verifying link...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center">
                <p className="text-destructive">{error}</p>
                 <Button asChild variant="link">
                    <Link href="/forgot-password">Request another link</Link>
                </Button>
            </div>
        );
    }

    if (isSuccess) {
      return (
        <div className="space-y-4">
            <CardHeader className="text-center p-0">
                <CardTitle className="text-2xl">Password Changed</CardTitle>
                <CardDescription>
                    You can now sign in with your new password
                </CardDescription>
            </CardHeader>
            <Button onClick={() => router.push('/login')} className="w-full">
                Login
            </Button>
            <div className="text-center text-sm">
                <Link href="/login" className="underline">
                    Back to Login
                </Link>
            </div>
        </div>
      );
    }

    if (isValidCode) {
      return (
        <>
            <CardHeader className="text-center p-0 mb-4">
                <CardTitle className="text-2xl">Reset Your Password</CardTitle>
                <CardDescription>
                    Enter a new password for your account.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Enter your new password"
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isResetting}>
                    {isResetting ? 'Resetting...' : 'Change Password'}
                </Button>
            </form>
        </>
      );
    }
    
    return null;
  };


  return (
     <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
       <div className="absolute top-8 left-8 flex items-center gap-2 text-2xl font-bold text-foreground">
          {settings.appLogo ? (
            <Image src={settings.appLogo} alt={settings.appName} width={32} height={32} className="h-8 w-8" />
          ) : (
            <FileText className="h-8 w-8 text-primary" />
          )}
          <span>{settings.appName || APP_NAME}</span>
        </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          {renderContent()}
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PasswordResetForm />
        </Suspense>
    );
}