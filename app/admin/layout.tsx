'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Boxes, History, Package, Users } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin/items', label: 'Master Items', icon: Package },
  { href: '/admin/events', label: 'Master Events', icon: Boxes },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/gacha-history', label: 'Gacha History', icon: History },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <AuthGuard>
      <main className='min-h-screen p-4 sm:p-7 lg:p-10'>
        <div className='mx-auto flex max-w-7xl flex-col gap-6 md:flex-row'>
          <aside className='shrink-0 md:w-56'>
            <div className='rounded-xl border bg-card p-3 md:sticky md:top-6'>
              <div className='mb-4 flex items-center gap-3 px-2 pt-1'>
                <span className='grid size-9 place-items-center rounded-lg bg-slate-900 text-white'>
                  <Boxes className='size-5' />
                </span>
                <div>
                  <p className='font-bold'>Admin Console</p>
                  <p className='text-xs text-muted-foreground'>Master data</p>
                </div>
              </div>
              <nav className='grid gap-1'>
                {links.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                      pathname === href &&
                        'bg-slate-900 text-white hover:bg-slate-900',
                    )}
                  >
                    <Icon className='size-4' />
                    {label}
                  </Link>
                ))}
              </nav>
              <Button
                className='mt-4 w-full'
                variant='outline'
                size='sm'
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft /> Dashboard
              </Button>
            </div>
          </aside>
          <section className='min-w-0 flex-1'>{children}</section>
        </div>
      </main>
    </AuthGuard>
  );
}
