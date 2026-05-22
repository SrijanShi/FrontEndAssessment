import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plane, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BookingCard } from '@/components/booking/BookingCard';
import { Button } from '@/components/ui/Button';
import type { Booking, Flight, Seat } from '@/types';

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/bookings');

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*, flight:flights(*), seat:seats(*)')
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-red-600">Failed to load bookings. Please refresh.</p>
      </div>
    );
  }

  const typedBookings = (bookings ?? []) as (Booking & { flight: Flight; seat: Seat })[];
  const active = typedBookings.filter((b) => b.status !== 'cancelled');
  const past = typedBookings.filter((b) => b.status === 'cancelled');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {active.length} active · {past.length} cancelled
          </p>
        </div>
        <Link href="/">
          <Button className="gap-2">
            <Plus size={16} />
            New Booking
          </Button>
        </Link>
      </div>

      {typedBookings.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl bg-white px-8 py-16 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Plane size={28} className="rotate-45 text-blue-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No bookings yet</h3>
          <p className="mt-1 text-sm text-slate-500">Search for a flight to get started</p>
          <Link href="/" className="mt-5 inline-block">
            <Button>Search Flights</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Active bookings */}
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Active
              </h2>
              <div className="flex flex-col gap-3">
                {active.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}

          {/* Cancelled bookings */}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Cancelled
              </h2>
              <div className="flex flex-col gap-3">
                {past.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
