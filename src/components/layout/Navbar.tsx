'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plane, BookOpen, LogOut, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store/userStore';
import { useFlightStore } from '@/store/flightStore';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

export function Navbar() {
  const router = useRouter();
  const clearSession = useUserStore((s) => s.clearSession);
  const resetBooking = useFlightStore((s) => s.resetBooking);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearSession();
    resetBooking();
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-40 bg-blue-800 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-blue-100">
          <Plane size={22} className="rotate-45" />
          <span className="text-lg font-bold tracking-tight">SkyBook</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-blue-300 sm:block">
                {user.email}
              </span>
              <Link href="/bookings">
                <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-100 hover:bg-blue-700 hover:text-white transition-colors">
                  <BookOpen size={15} />
                  <span className="hidden sm:inline">My Bookings</span>
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-100 hover:bg-blue-700 hover:text-white transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
                <LogIn size={15} />
                Login
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
