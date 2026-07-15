'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ShieldCheck, UserRound } from 'lucide-react';

export function UserNav({ role, roles }: { role?: string; roles?: string[] }) {
  const pathname = usePathname();
  const admin = role === 'ADMIN' || roles?.includes('ADMIN');
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/profile', label: 'Profile', icon: UserRound },
  ];
  if (admin)
    links.push({ href: '/admin/items', label: 'Admin', icon: ShieldCheck });
  return (
    <nav className='flex gap-1 rounded-xl border bg-card p-1'>
      {links.map(({ href, label, icon: Icon }) => (
        <Button
          key={href}
          asChild
          variant={
            pathname === href ||
            (href === '/admin/items' && pathname.startsWith('/admin'))
              ? 'default'
              : 'ghost'
          }
          size='sm'
        >
          <Link href={href}>
            <Icon />
            {label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
