'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      theme="dark"
      richColors
      toastOptions={{
        style: {
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--card-foreground)',
        },
        classNames: {
          toast: 'text-sm',
          success: 'border-green-500/20 bg-green-500/10',
          error: 'border-red-500/20 bg-red-500/10',
          warning: 'border-yellow-500/20 bg-yellow-500/10',
          info: 'border-blue-500/20 bg-blue-500/10',
        },
      }}
    />
  );
}
