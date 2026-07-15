import type { ReactNode } from 'react';

export const list = <T,>(value: unknown): T[] =>
  Array.isArray(value)
    ? value
    : Array.isArray((value as { data?: unknown })?.data)
      ? (value as { data: T[] }).data
      : [];
export const message = (error: unknown) =>
  (error as { response?: { data?: { message?: string } }; message?: string })
    ?.response?.data?.message ||
  (error as Error).message ||
  'Terjadi kesalahan.';
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className='grid gap-1.5 text-sm font-medium'>
      {label}
      {children}
      {error && <span className='text-xs text-destructive'>{error}</span>}
    </label>
  );
}
