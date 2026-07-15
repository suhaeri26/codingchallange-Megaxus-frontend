'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Boxes, Edit3, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { list, message } from '@/components/admin/shared';
import { Badge } from '@/components/ui/badge';
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
  getEvents,
  patchEventsId,
  postEvents,
  useDeleteEventsId,
  useGetEvents,
} from '@/generated/service/gacha-event/gacha-event';
import {
  deleteEventsItemsId,
  patchEventsItemsId,
  postEventsEventIdItems,
  useGetEventsEventIdItems,
} from '@/generated/service/gacha-event-item/gacha-event-item';
import { useGetItems } from '@/generated/service/item/item';

type Event = {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
};
type MasterItem = { id: number; name: string };
type EventItem = {
  id: number;
  itemId: number;
  dropRate: number;
  stock?: number | null;
};
type Row = {
  key: string;
  id?: number;
  itemId: number;
  dropRate: number;
  stock: number | null;
};
const row = (value?: Partial<Row>): Row => ({
  key: crypto.randomUUID(),
  itemId: 0,
  dropRate: 0,
  stock: 0,
  ...value,
});
const eventIdFrom = (value: unknown): number | undefined => {
  const data = value as { id?: unknown; data?: unknown };
  return typeof data?.id === 'number'
    ? data.id
    : data?.data
      ? eventIdFrom(data.data)
      : undefined;
};

export default function EventsPage() {
  const client = useQueryClient();
  const eventQuery = useGetEvents();
  const events = list<Event>(eventQuery.data);
  const masterItems = list<MasterItem>(useGetItems().data);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setActive] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const poolQuery = useGetEventsEventIdItems(editing?.id ?? 0, {
    query: { enabled: open && !!editing },
  });
  const poolData = (poolQuery as { data?: unknown }).data;
  useEffect(() => {
    if (editing && poolData)
      setRows(list<EventItem>(poolData).map((item) => row(item)));
  }, [editing, poolData]);
  const total = useMemo(
    () => rows.reduce((sum, item) => sum + (Number(item.dropRate) || 0), 0),
    [rows],
  );
  const invalidate = () => client.invalidateQueries({ queryKey: ['/events'] });
  const remove = useDeleteEventsId({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success('Event dihapus');
      },
      onError: (error) => toast.error(message(error)),
    },
  });
  const openForm = (event?: Event) => {
    setEditing(event ?? null);
    setName(event?.name ?? '');
    setDescription(event?.description ?? '');
    setActive(event?.isActive ?? true);
    setRows([]);
    setOpen(true);
  };
  const setRow = (key: string, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return toast.error('Nama event wajib diisi.');
    if (Math.abs(total - 100) > 0.000001)
      return toast.error(
        'Total Drop Rate harus tepat 100%. Total saat ini: ' + total + '%.',
      );
      console.log({rows})
    if (
      !rows.length ||
      rows.some(
        (item) =>
          item.itemId <= 0 ||
          item.dropRate <= 0,
      )
    )
      return toast.error('Lengkapi item, Drop Rate, dan stok event.');
    if (new Set(rows.map((item) => item.itemId)).size !== rows.length)
      return toast.error(
        'Satu item hanya boleh ditambahkan sekali dalam event.',
      );
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description || undefined,
        isActive,
      };
      let id = editing?.id;
      if (id) await patchEventsId(id, data);
      else {
        const created = await postEvents(data);
        id = eventIdFrom(created);
        if (!id) {
          const refreshed = list<Event>(await getEvents());
          id = refreshed.find((item) => item.name === data.name)?.id;
        }
      }
      if (!id)
        throw new Error(
          'Event berhasil dibuat tetapi ID event tidak ditemukan.',
        );
      const old = list<EventItem>(poolData);
      const remaining = new Set(
        rows.flatMap((item) => (item.id ? [item.id] : [])),
      );
      await Promise.all(
        old
          .filter((item) => !remaining.has(item.id))
          .map((item) => deleteEventsItemsId(item.id)),
      );
      await Promise.all(
        rows.map((item) =>
          item.id
            ? patchEventsItemsId(item.id, {
                itemId: item.itemId,
                dropRate: item.dropRate,
              })
            : postEventsEventIdItems(id!, {
                itemId: item.itemId,
                dropRate: item.dropRate,
              }),
        ),
      );
      await invalidate();
      await client.invalidateQueries({ queryKey: [`/events/${id}/items`] });
      setOpen(false);
      toast.success(editing ? 'Event diperbarui' : 'Event dibuat');
    } catch (error) {
      toast.error(message(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <header className='mb-6'>
        <h1 className='text-xl font-bold'>Master Events</h1>
        <p className='text-sm text-muted-foreground'>
          Kelola event gacha beserta item, Drop Rate, dan stoknya.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Boxes /> Gacha Events
          </CardTitle>
          <CardDescription>
            Item event dikelola langsung dari formulir event.
          </CardDescription>
          <div className='mt-2'>
            <Button onClick={() => openForm()}>
              <Plus /> Buat event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {eventQuery.isLoading ? (
            <Skeleton className='h-36 w-full' />
          ) : events.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className='font-medium'>{event.name}</TableCell>
                    <TableCell className='max-w-72 truncate'>
                      {event.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.isActive ? 'default' : 'secondary'}>
                        {event.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          onClick={() => openForm(event)}
                        >
                          <Edit3 />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          className='text-destructive'
                          onClick={() =>
                            confirm('Hapus event ini?') &&
                            remove.mutate({ id: event.id })
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
              Belum ada event. Buat event pertama.
            </p>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit event' : 'Buat event'}</DialogTitle>
            <DialogDescription>
              Atur informasi event dan seluruh item pool dalam satu formulir.
            </DialogDescription>
          </DialogHeader>
          <form className='grid gap-5' onSubmit={submit}>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='grid gap-1.5 text-sm font-medium'>
                Nama event
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className='grid gap-1.5 text-sm font-medium'>
                Deskripsi
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
            </div>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <input
                type='checkbox'
                checked={isActive}
                onChange={(event) => setActive(event.target.checked)}
              />{' '}
              Event aktif
            </label>
            <div className='rounded-lg border'>
              <div className='flex items-center justify-between border-b p-3'>
                <div>
                  <p className='font-medium'>Event Items</p>
                  <p
                    className={
                      'text-sm ' +
                      (Math.abs(total - 100) < 0.000001
                        ? 'text-emerald-600'
                        : 'text-destructive')
                    }
                  >
                    Total Drop Rate: {total}%{' '}
                    {Math.abs(total - 100) < 0.000001
                      ? '✓'
                      : '— harus tepat 100%'}
                  </p>
                </div>
                <Button
                  type='button'
                  size='sm'
                  onClick={() => setRows((current) => [...current, row()])}
                >
                  <Plus /> Tambah item
                </Button>
              </div>
              {poolQuery.isLoading ? (
                <Skeleton className='m-3 h-20' />
              ) : (
                <div className='grid gap-3 p-3'>
                  {rows.map((item) => (
                    <div
                      key={item.key}
                      className='grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_110px_110px_36px]'
                    >
                      <select
                        className='h-9 rounded-md border bg-background px-3 text-sm'
                        value={item.itemId}
                        onChange={(event) =>
                          setRow(item.key, {
                            itemId: Number(event.target.value),
                          })
                        }
                      >
                        <option value={0}>Pilih item</option>
                        {masterItems.map((master) => (
                          <option key={master.id} value={master.id}>
                            {master.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        aria-label='Drop Rate'
                        type='number'
                        min='0'
                        step='0.01'
                        value={item.dropRate}
                        onChange={(event) =>
                          setRow(item.key, {
                            dropRate: Number(event.target.value),
                          })
                        }
                        placeholder='Drop Rate %'
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        className='text-destructive'
                        onClick={() =>
                          setRows((current) =>
                            current.filter(
                              (currentItem) => currentItem.key !== item.key,
                            ),
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  {!rows.length && (
                    <p className='py-4 text-center text-sm text-muted-foreground'>
                      Tambahkan minimal satu item ke event.
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className='text-sm text-destructive'>
              {Math.abs(total - 100) > 0.000001 &&
                'Event tidak dapat disimpan sebelum total Drop Rate tepat 100%.'}
            </p>
            <Button type='submit' disabled={saving}>
              {saving
                ? 'Menyimpan...'
                : editing
                  ? 'Simpan perubahan'
                  : 'Buat event'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
