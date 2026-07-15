'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Edit3, Package, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Field, list, message } from '@/components/admin/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useDeleteItemsId,
  useGetItems,
  usePatchItemsId,
  usePostItems,
} from '@/generated/service/item/item';

type Item = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};
const schema = z.object({
  name: z.string().min(1, 'Nama item wajib diisi'),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().max(500).optional(),
});
type Values = z.infer<typeof schema>;

export default function ItemsPage() {
  const client = useQueryClient();
  const query = useGetItems();
  const items = list<Item>(query.data);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', imageUrl: '' },
  });
  const invalidate = () => client.invalidateQueries({ queryKey: ['/items'] });
  const create = usePostItems({
    mutation: {
      onSuccess: () => {
        invalidate();
        setOpen(false);
        toast.success('Item dibuat');
      },
      onError: (e) => toast.error(message(e)),
    },
  });
  const update = usePatchItemsId({
    mutation: {
      onSuccess: () => {
        invalidate();
        setOpen(false);
        toast.success('Item diperbarui');
      },
      onError: (e) => toast.error(message(e)),
    },
  });
  const remove = useDeleteItemsId({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success('Item dihapus');
      },
      onError: (e) => toast.error(message(e)),
    },
  });
  const openForm = (item?: Item) => {
    setEditing(item ?? null);
    form.reset(
      item
        ? {
            name: item.name,
            description: item.description ?? '',
            imageUrl: item.imageUrl ?? '',
          }
        : { name: '', description: '', imageUrl: '' },
    );
    setOpen(true);
  };
  return (
    <>
      <header className='mb-6'>
        <h1 className='text-xl font-bold'>Master Items</h1>
        <p className='text-sm text-muted-foreground'>
          Kelola katalog item yang dapat dimasukkan ke event gacha.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package /> Items
          </CardTitle>
          <CardDescription>
            Tambah, ubah, atau hapus data item master.
          </CardDescription>
          <div className='mt-2'>
            <Button onClick={() => openForm()}>
              <Plus /> Buat item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <Skeleton className='h-36 w-full' />
          ) : items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Image URL</TableHead>
                  <TableHead className='text-right'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='font-medium'>{item.name}</TableCell>
                    <TableCell className='max-w-64 truncate'>
                      {item.description || '—'}
                    </TableCell>
                    <TableCell className='max-w-48 truncate'>
                      {item.imageUrl || '—'}
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          onClick={() => openForm(item)}
                        >
                          <Edit3 />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          className='text-destructive'
                          onClick={() =>
                            confirm('Hapus item ini?') &&
                            remove.mutate({ id: item.id })
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
              Belum ada item. Buat item pertama.
            </p>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit item' : 'Buat item'}</DialogTitle>
            <DialogDescription>
              Informasi ini digunakan dalam katalog item.
            </DialogDescription>
          </DialogHeader>
          <form
            className='grid gap-4'
            onSubmit={form.handleSubmit((values) =>
              editing
                ? update.mutate({ id: editing.id, data: values })
                : create.mutate({ data: values }),
            )}
          >
            <Field
              label='Nama item'
              error={form.formState.errors.name?.message}
            >
              <Input {...form.register('name')} />
            </Field>
            <Field label='Deskripsi'>
              <Input {...form.register('description')} />
            </Field>
            <Field label='Image URL'>
              <Input {...form.register('imageUrl')} />
            </Field>
            <Button
              type='submit'
              disabled={create.isPending || update.isPending}
            >
              {editing ? 'Simpan perubahan' : 'Buat item'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
