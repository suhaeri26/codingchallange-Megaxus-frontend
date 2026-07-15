'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  usePostAuthLogin,
  usePostAuthRegister,
} from '@/generated/service/authentication/authentication';
import { Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Masukkan email yang valid'),
  password: z.string().min(8, 'Minimal 8 karakter'),
});
const registerSchema = loginSchema.extend({
  name: z.string().min(3, 'Minimal 3 karakter'),
});
const errorMessage = (e: unknown) =>
  (e as { response?: { data?: { message?: string } }; message?: string })
    ?.response?.data?.message ||
  (e as Error).message ||
  'Terjadi kesalahan. Coba lagi.';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className='grid gap-1.5 text-sm font-medium'>
      {label}
      {children}
      {error && <span className='text-xs text-destructive'>{error}</span>}
    </label>
  );
}

function AuthPageContent() {
  const [isRegister, setIsRegister] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const login = usePostAuthLogin({
    mutation: {
      onSuccess: () => {
        toast.success('Selamat datang kembali!');
        router.replace('/dashboard');
      },
      onError: (e) => toast.error(errorMessage(e)),
    },
  });
  const register = usePostAuthRegister({
    mutation: {
      onSuccess: () => {
        toast.success('Akun berhasil dibuat. Silakan masuk.');
        setIsRegister(false);
      },
      onError: (e) => toast.error(errorMessage(e)),
    },
  });
  const form: any = isRegister ? registerForm : loginForm;
  const pending = login.isPending || register.isPending;

  useEffect(() => {
    const verified = searchParams.get('verified');
    const message = searchParams.get('message');

    if (verified === '1') {
      toast.success('Email berhasil diverifikasi. Silakan login.');
    }

    if (verified === '0') {
      toast.error(message || 'Verifikasi email gagal. Silakan coba lagi.');
    }
  }, [searchParams]);

  return (
    <main className='min-h-screen grid place-items-center p-4'>
      <Card className='w-full max-w-md shadow-2xl shadow-indigo-500/15'>
        <CardHeader>
          <div className='mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white'>
            <Sparkles />
          </div>
          <CardTitle className='text-2xl'>
            {isRegister ? 'Buat akun baru' : 'Selamat datang'}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? 'Daftar untuk mulai mengumpulkan item langka.'
              : 'Masuk untuk melanjutkan koleksi gacha-mu.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className='grid gap-4'
            onSubmit={form.handleSubmit((values: any) =>
              isRegister
                ? register.mutate({
                    data: values as z.infer<typeof registerSchema>,
                  })
                : login.mutate({ data: values }),
            )}
          >
            {isRegister && (
              <Field
                label='Nama'
                error={registerForm.formState.errors.name?.message}
              >
                <Input
                  placeholder='Nama kamu'
                  {...registerForm.register('name')}
                />
              </Field>
            )}
            <Field label='Email' error={form.formState.errors.email?.message}>
              <Input
                type='email'
                placeholder='you@example.com'
                {...form.register('email')}
              />
            </Field>
            <Field
              label='Password'
              error={form.formState.errors.password?.message}
            >
              <Input
                type='password'
                placeholder='Minimal 8 karakter'
                {...form.register('password')}
              />
            </Field>
            <Button className='mt-1 h-10' type='submit' disabled={pending}>
              {pending
                ? 'Memproses...'
                : isRegister
                  ? 'Daftar sekarang'
                  : 'Masuk'}
            </Button>
          </form>
          <button
            className='mt-5 w-full text-sm font-medium text-indigo-600 hover:underline'
            onClick={() => setIsRegister((value) => !value)}
          >
            {isRegister
              ? 'Sudah punya akun? Masuk'
              : 'Belum punya akun? Daftar'}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className='min-h-screen grid place-items-center p-4'>
          <div className='w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm'>
            <p className='text-sm text-muted-foreground'>Memuat halaman...</p>
          </div>
        </main>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
