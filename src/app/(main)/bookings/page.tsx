import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plane, Search } from 'lucide-react';
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
        <p className="text-red-600">Failed to load bookings. Please try again.</p>
      </div>
    );
  }

  const typedBookings = (bookings ?? []) as (Booking & { flight: Flight; seat: Seat })[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-sm text-slate-500">
            {typedBookings.length} booking{typedBookings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Search size={16} />
            Search Flights
          </Button>
        </Link>
      </div>

      {typedBookings.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
          <Plane size={48} className="mx-auto mb-4 rotate-45 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700">No bookings yet</h3>
          <p className="mt-1 text-sm text-slate-500">Start by searching for a flight</p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Search Flights</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {typedBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
