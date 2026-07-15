'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthGuard } from '@/components/auth-guard';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGetUsersMe, usePatchUsersMe } from '@/generated/service/user/user';

type User = {
  name?: string;
  email?: string;
  coins?: number;
  role?: string;
  roles?: string[];
};
const schema = z.object({ name: z.string().min(3, 'Nama minimal 3 karakter') });
export default function ProfilePage() {
  return (
    <AuthGuard>
      <Profile />
    </AuthGuard>
  );
}
function Profile() {
  const client = useQueryClient();
  const query = useGetUsersMe();
  const user = ((query.data as any)?.data as unknown as User) || {};
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });
  useEffect(() => {
    form.reset({ name: user.name || '' });
  }, [user.name, form]);
  const update = usePatchUsersMe({
    mutation: {
      onSuccess: () => {
        client.invalidateQueries({ queryKey: ['/users/me'] });
        toast.success('Profile berhasil diperbarui');
      },
      onError: () => toast.error('Profile gagal diperbarui'),
    },
  });
  return (
    <main className='min-h-screen px-4 py-5 sm:px-7 lg:px-10'>
      <div className='mx-auto max-w-6xl'>
        <header className='mb-7 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-xl font-bold'>Gacha Nexus</h1>
            <p className='text-sm text-muted-foreground'>Pengaturan akun</p>
          </div>
          <UserNav role={user.role} roles={user.roles} />
        </header>
        <div className='grid gap-5 md:grid-cols-[1fr_.65fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Perbarui informasi akunmu.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className='grid gap-4'
                onSubmit={form.handleSubmit((data) => update.mutate({ data }))}
              >
                <label className='grid gap-1.5 text-sm font-medium'>
                  Nama
                  <Input {...form.register('name')} />
                </label>
                {form.formState.errors.name && (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.name.message}
                  </p>
                )}
                <label className='grid gap-1.5 text-sm font-medium'>
                  Email
                  <Input value={user.email || ''} disabled />
                </label>
                <Button type='submit' disabled={update.isPending}>
                  {update.isPending ? 'Menyimpan...' : 'Simpan perubahan'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Coins tersedia</CardDescription>
              <CardTitle className='text-4xl'>{user.coins ?? 0}</CardTitle>
            </CardHeader>
            <CardContent className='text-muted-foreground'>
              Gunakan coins untuk draw gacha di dashboard.
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
