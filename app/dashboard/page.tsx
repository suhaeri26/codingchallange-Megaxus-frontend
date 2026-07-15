'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/auth-guard';
import { UserNav } from '@/components/user-nav';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetEvents } from '@/generated/service/gacha-event/gacha-event';
import {
  useGetGachaHistory,
  usePostGachaDraw,
} from '@/generated/service/gacha/gacha';
import { useGetUsersMe } from '@/generated/service/user/user';
import { usePostAuthLogout } from '@/generated/service/authentication/authentication';
import { Coins, Dices, LogOut, Sparkles, Trophy } from 'lucide-react';

type User = {
  name?: string;
  email?: string;
  coins?: number;
  role?: string;
  roles?: string[];
};
type Event = {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
};
type History = {
  id?: number;
  event?: Event | string;
  eventItem:{item?: { name?: string; itemId?: number }, itemId: number} | string;
  cost?: number;
  createdAt?: string;
};
const list = <T,>(value: unknown): T[] =>
  Array.isArray(value)
    ? value
    : Array.isArray((value as { data?: unknown })?.data)
      ? (value as { data: T[] }).data
      : [];
const msg = (e: unknown) =>
  (e as { response?: { data?: { message?: string } }; message?: string })
    ?.response?.data?.message ||
  (e as Error).message ||
  'Terjadi kesalahan.';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
function Dashboard() {
  const router = useRouter();
  const client = useQueryClient();
  const [chosen, setChosen] = useState<Event | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [opening, setOpening] = useState(false);
  const me = useGetUsersMe();
  const eventsQuery = useGetEvents();
  const historyQuery = useGetGachaHistory();
  const user = ((me.data as any)?.data as unknown as User) || {};
  const events = list<Event>(eventsQuery.data).filter(
    (event) => event.isActive,
  );
  const history = list<History>(historyQuery.data);
  const logout = usePostAuthLogout({
    mutation: {
      onSuccess: () => {
        client.clear();
        router.replace('/');
      },
      onError: (e) => toast.error(msg(e)),
    },
  });
  const draw = usePostGachaDraw({
    mutation: {
      onSuccess: (data) => {
        client.invalidateQueries({ queryKey: ['/users/me'] });
        client.invalidateQueries({ queryKey: ['/gacha/history'] });
        window.setTimeout(() => {
          setResult(data);
          setOpening(false);
        }, 2400);
      },
      onError: (e) => {
        setOpening(false);
        toast.error(msg(e));
      },
    },
  });
  return (
    <main className='min-h-screen px-4 py-5 sm:px-7 lg:px-10'>
      <div className='mx-auto max-w-6xl'>
        <header className='mb-8 flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <span className='grid size-10 place-items-center rounded-xl bg-indigo-600 text-white'>
              <Sparkles className='size-5' />
            </span>
            <div>
              <h1 className='font-bold'>Gacha Nexus</h1>
              <p className='text-xs text-muted-foreground'>
                Halo, {user.name || 'Collector'}
              </p>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <UserNav role={user.role} roles={user.roles} />
            <Badge className='h-8 gap-1 bg-amber-400/15 text-amber-700'>
              <Coins className='size-3.5' />
              {user.coins ?? 0}
            </Badge>
            <Button
              variant='outline'
              size='sm'
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut />
              Keluar
            </Button>
          </div>
        </header>
        <section className='grid gap-6 lg:grid-cols-[1.35fr_.65fr]'>
          <Card className='overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 text-white'>
            <CardContent className='grid min-h-96 place-items-center p-8 text-center'>
              <div>
                <div
                  className={`mx-auto mb-5 grid size-20 place-items-center rounded-3xl bg-white/15 ${opening ? 'animate-[spin_0.65s_linear_infinite]' : ''}`}
                >
                  <Dices className='size-10 text-amber-300' />
                </div>
                <p className='text-xs font-bold tracking-[.25em] text-indigo-200'>
                  CHOOSE YOUR CHANCE
                </p>
                <h2 className='mt-2 text-4xl font-bold'>
                  {opening ? 'Opening...' : 'Find your rare.'}
                </h2>
                <p className='mx-auto mt-3 max-w-sm text-indigo-100'>
                  {opening
                    ? 'The reward is rolling. Don’t blink!'
                    : 'Pilih event, lalu buka kesempatan mendapatkan item langka.'}
                </p>
                <div className='mt-7 grid gap-2'>
                  {eventsQuery.isLoading ? (
                    <Skeleton className='h-10 w-80' />
                  ) : events.length ? (
                    events.map((event) => (
                      <Button
                        key={event.id}
                        variant='secondary'
                        className='h-auto min-h-10 justify-start text-left'
                        disabled={opening || draw.isPending}
                        onClick={() => {
                          setChosen(event);
                          setOpening(true);
                          draw.mutate({ data: { eventId: event.id } });
                        }}
                      >
                        <Dices />
                        {opening && chosen?.id === event.id
                          ? 'Rolling reward...'
                          : event.name}
                      </Button>
                    ))
                  ) : (
                    <p className='rounded-lg border border-white/20 p-3 text-sm'>
                      Belum ada event aktif.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className='grid content-start gap-4'>
            <Card>
              <CardHeader>
                <CardDescription>Saldo kamu</CardDescription>
                <CardTitle className='flex items-center gap-2 text-3xl'>
                  <Coins className='text-amber-500' />
                  {user.coins ?? 0}
                </CardTitle>
              </CardHeader>
              <CardContent className='text-muted-foreground'>
                Coins dipotong otomatis setelah draw berhasil.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Akun</CardTitle>
              </CardHeader>
              <CardContent className='grid gap-1'>
                <span className='font-medium'>{user.name || '—'}</span>
                <span className='text-sm text-muted-foreground'>
                  {user.email || '—'}
                </span>
              </CardContent>
            </Card>
          </div>
        </section>
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Riwayat draw</CardTitle>
            <CardDescription>Hasil gacha terbaru dari akunmu.</CardDescription>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading ? (
              <Skeleton className='h-28 w-full' />
            ) : history.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Biaya</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, index) => (
                    <TableRow key={entry.id ?? index}>
                      <TableCell>
                        {typeof entry.event === 'string'
                          ? entry.event
                          : entry.event?.name || '—'}
                      </TableCell>
                      <TableCell>
                        {typeof entry.eventItem === 'string'
                          ? entry.eventItem
                          : entry.eventItem?.item?.name || entry.eventItem?.itemId || '—'}
                      </TableCell>
                      <TableCell>{entry.cost ?? '—'}</TableCell>
                      <TableCell>
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleString('id-ID')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
                Belum ada riwayat draw.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={result !== null}
        onOpenChange={(open) => !open && setResult(null)}
      >
        <DialogContent className='text-center'>
          <div className='mx-auto grid size-16 place-items-center rounded-full bg-amber-400/20 text-amber-600'>
            <Trophy className='size-8' />
          </div>
          <DialogHeader>
            <DialogTitle>Draw berhasil!</DialogTitle>
            <DialogDescription>
              {String(
                (
                  result as {
                    item?: { name?: string };
                    data?: { item?: { name?: string } };
                  }
                )?.item?.name ||
                  (result as { data?: { item?: { name?: string } } })?.data
                    ?.item?.name ||
                  'Cek riwayat untuk melihat item yang didapat.',
              )}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setResult(null)}>Lanjutkan</Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
