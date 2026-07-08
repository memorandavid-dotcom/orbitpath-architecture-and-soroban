'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { User } from '@/lib/auth/context';
import { toast } from 'sonner';

interface TopBarProps {
  user: User;
}

export const TopBar: React.FC<TopBarProps> = ({ user }) => {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
      {/* Left Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Quick Stats */}
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">Balance</p>
            <p className="font-semibold text-foreground">$1,234.56</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Saved</p>
            <p className="font-semibold text-accent">$234.12</p>
          </div>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary transition"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground">{user.name}</span>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
