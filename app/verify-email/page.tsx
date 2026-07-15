'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetAuthVerifyEmail } from '@/generated/service/authentication/authentication';

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);

  const shouldFetch = Boolean(token);

  const { isSuccess, isError, error } = useGetAuthVerifyEmail(
    { token: token ?? '' },
    {
      query: {
        enabled: shouldFetch,
        retry: false,
      },
    },
  );

  useEffect(() => {
    if (!shouldFetch || done) return;

    if (isSuccess) {
      setDone(true);
      router.replace('/?verified=1');
    }

    if (isError) {
      setDone(true);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Verifikasi email gagal.';
      router.replace(`/?verified=0&message=${encodeURIComponent(message)}`);
    }
  }, [shouldFetch, done, isSuccess, isError, error, router]);

  return (
    <main className='min-h-screen grid place-items-center p-4 text-center'>
      <div className='w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm'>
        <h1 className='text-xl font-semibold'>Memverifikasi email...</h1>
        <p className='mt-2 text-sm text-muted-foreground'>Mohon tunggu sebentar.</p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className='min-h-screen grid place-items-center p-4 text-center'>
          <div className='w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm'>
            <p className='text-sm text-muted-foreground'>Memuat halaman...</p>
          </div>
        </main>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
