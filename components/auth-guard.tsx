'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetAuthMe } from '@/generated/service/authentication/authentication';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useGetAuthMe({ query: { retry: false } });
  useEffect(() => {
    if (auth.isError) router.replace('/');
  }, [auth.isError, router]);
  if (auth.isLoading || auth.isError)
    return (
      <main className='min-h-screen grid place-items-center'>
        <Skeleton className='h-48 w-80' />
      </main>
    );
  return <>{children}</>;
}
