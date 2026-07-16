'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, RefreshCw } from 'lucide-react';
import { apiClient } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type AdminGachaRecord = {
  id: number;
  user?: { id?: number; name?: string; email?: string; role?: string };
  event?: { id?: number; name?: string };
  eventItem?: { item?: { name?: string } };
  cost?: number;
  dropRate?: string | number;
  createdAt?: string;
};

type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

type AdminHistoryResponse = {
  success: boolean;
  message: string;
  data: AdminGachaRecord[];
  meta?: PaginationMeta;
};

const fetchAdminHistory = async (page: number, limit: number) => {
  const { data } = await apiClient.get<AdminHistoryResponse>('/gacha/admin/history', {
    params: { page, limit },
  });
  return data;
};

export default function AdminGachaHistoryPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const query = useQuery({
    queryKey: ['/gacha/admin/history', page, limit],
    queryFn: () => fetchAdminHistory(page, limit),
    refetchInterval: autoRefresh ? 1000 : false,
    refetchIntervalInBackground: true,
  });

  const records = Array.isArray(query.data?.data) ? query.data.data : [];
  const meta = query.data?.meta;

  return (
    <>
      <header className='mb-6 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-xl font-bold'>Riwayat Gacha Semua User</h1>
          <p className='text-sm text-muted-foreground'>Pantau hasil draw pengguna secara real-time dengan polling setiap 1 detik.</p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge className='gap-1 bg-emerald-500/10 text-emerald-700'>
            <History className='size-3.5' />
            Live
          </Badge>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => void query.refetch()}
          >
            <RefreshCw className='mr-2 size-4' />
            Refresh
          </Button>
          <Button
            type='button'
            variant={autoRefresh ? 'default' : 'outline'}
            size='sm'
            onClick={() => setAutoRefresh((value) => !value)}
          >
            {autoRefresh ? 'Auto refresh on' : 'Auto refresh off'}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Log draw terbaru</CardTitle>
          <CardDescription>
            {meta
              ? `Halaman ${meta.page} dari ${meta.totalPages} • ${meta.totalItems} total log`
              : 'Memuat data log gacha...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <Skeleton className='h-40 w-full' />
          ) : records.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Drop Rate</TableHead>
                    <TableHead>Biaya</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className='font-medium'>
                          {entry.user?.name || '—'}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {entry.user?.email || '—'}
                        </div>
                      </TableCell>
                      <TableCell>{entry.event?.name || '—'}</TableCell>
                      <TableCell>{entry.eventItem?.item?.name || '—'}</TableCell>
                      <TableCell>{entry.dropRate ?? '—'}</TableCell>
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
              <div className='mt-4 flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</p>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={page <= 1 || !meta || query.isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={!meta || page >= meta.totalPages || query.isFetching}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>Belum ada log gacha yang tercatat.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
