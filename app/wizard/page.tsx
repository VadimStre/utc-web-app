
"use client"

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { UTCWizard } from '@/components/utc-wizard';
import { Loader2 } from 'lucide-react';

export default function WizardPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <UTCWizard
      onCancel={() => router.push('/')}
      onCreated={() => router.push('/')}
    />
  );
}
