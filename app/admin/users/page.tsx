'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Coins, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Field, list, message } from '@/components/admin/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetUsers, usePatchUsersUserIdCoins } from '@/generated/service/user/user';

type User = { id: number; name?: string; email?: string; coins?: number; role?: string; roles?: string[] };
const schema = z.object({ amount: z.coerce.number().int('Jumlah harus bilangan bulat').positive('Jumlah harus lebih dari 0') });
type Values = z.infer<typeof schema>;

export default function UsersPage() {
  const client = useQueryClient();
  const query = useGetUsers();
  const users = list<User>(query.data);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const form = useForm<Values>({ resolver: zodResolver(schema as z.ZodType<Values>), defaultValues: { amount: 1 } });
  const adjust = usePatchUsersUserIdCoins({ mutation: {
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['/users'] });
      setSelectedUser(null);
      toast.success('Saldo coin berhasil disesuaikan');
    },
    onError: (error) => toast.error(message(error)),
  } });
  const openAdjust = (user: User) => { form.reset({ amount: 1 }); setAdjustmentType('add'); setSelectedUser(user); };
  const submit = (values: Values) => {
    if (selectedUser) adjust.mutate({ userId: selectedUser.id, data: { amount: adjustmentType === 'add' ? values.amount : -values.amount } });
  };
  return (
    <>
      <header className='mb-6'>
        <h1 className='text-xl font-bold'>Users</h1>
        <p className='text-sm text-muted-foreground'>Lihat pengguna dan sesuaikan saldo coin mereka.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'><Coins /> Daftar pengguna</CardTitle>
          <CardDescription>Tambah atau kurangi saldo coin pengguna.</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? <Skeleton className='h-36 w-full' /> : users.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Coins</TableHead><TableHead className='text-right'>Aksi</TableHead></TableRow></TableHeader>
              <TableBody>{users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className='font-medium'>{user.name || '—'}</TableCell><TableCell>{user.email || '—'}</TableCell>
                  <TableCell>{user.role || user.roles?.join(', ') || '—'}</TableCell><TableCell>{user.coins ?? 0}</TableCell>
                  <TableCell className='text-right'><Button variant='outline' size='sm' onClick={() => openAdjust(user)}><Pencil /> Adjust coin</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          ) : <p className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>Belum ada pengguna.</p>}
        </CardContent>
      </Card>
      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust coin</DialogTitle><DialogDescription>{selectedUser?.name || selectedUser?.email} saat ini memiliki {selectedUser?.coins ?? 0} coins.</DialogDescription></DialogHeader>
          <form className='grid gap-4' onSubmit={form.handleSubmit(submit)}>
            <div className='grid grid-cols-2 gap-2'>
              <Button type='button' variant={adjustmentType === 'add' ? 'default' : 'outline'} onClick={() => setAdjustmentType('add')}>Tambah coin</Button>
              <Button type='button' variant={adjustmentType === 'subtract' ? 'destructive' : 'outline'} onClick={() => setAdjustmentType('subtract')}>Kurangi coin</Button>
            </div>
            <Field label='Jumlah coin' error={form.formState.errors.amount?.message}><Input type='number' min='1' step='1' {...form.register('amount')} /></Field>
            <p className='text-xs text-muted-foreground'>Masukkan jumlah coin yang ingin {adjustmentType === 'add' ? 'ditambahkan' : 'dikurangi'}.</p>
            <Button type='submit' disabled={adjust.isPending}>{adjust.isPending ? 'Menyimpan...' : 'Simpan penyesuaian'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
