'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME } from '@/lib/constants';
import { FileText } from 'lucide-react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Check your email',
        description: 'A password reset link has been sent to your email address.',
      });
      setIsSent(true);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send password reset email.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
       <div className="absolute top-8 left-8 flex items-center gap-2 text-2xl font-bold text-foreground">
          <FileText className="h-8 w-8 text-primary" />
          <span>{APP_NAME}</span>
        </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            {isSent 
              ? "Check your inbox for a reset link."
              : "Enter your email and we'll send you a link to reset your password."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          ) : (
            <div className="text-center">
                <p className="text-muted-foreground mb-4">
                    Didn't receive an email? Check your spam folder or try again.
                </p>
                <Button onClick={() => setIsSent(false)}>Try Again</Button>
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            Remembered your password?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
