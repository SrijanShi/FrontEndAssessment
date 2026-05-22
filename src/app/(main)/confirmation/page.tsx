import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Plane, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, formatDuration, formatPrice } from '@/lib/utils';
import type { Booking, Flight, Seat, Passenger } from '@/types';

interface PageProps {
  searchParams: Promise<{ pnr?: string; booking?: string }>;
}

async function ConfirmationCard({ bookingId }: { bookingId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('bookings')
    .select('*, flight:flights(*), seat:seats(*), passengers(*)')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (!data) notFound();

  const booking = data as Booking & { flight: Flight; seat: Seat; passengers: Passenger[] };
  const passenger = booking.passengers?.[0];

  return (
    <div className="w-full max-w-md rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 p-6 text-center text-white">
        <CheckCircle size={48} className="mx-auto mb-3" />
        <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
        <p className="mt-1 text-blue-100">Your flight has been booked successfully</p>
      </div>

      {/* PNR */}
      <div className="border-b border-dashed border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-500 uppercase tracking-wide">PNR Code</p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-widest text-blue-600">
          {booking.pnr_code}
        </p>
        <Badge status={booking.status} className="mt-2" />
      </div>

      {/* Flight details */}
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2 text-slate-700">
          <Plane size={18} className="rotate-45" />
          <span className="font-semibold">Flight Details</span>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="text-center">
            <p className="text-3xl font-bold">{booking.flight.origin}</p>
            <p className="text-xs text-slate-500">{formatDateTime(booking.flight.departs_at)}</p>
          </div>
          <div className="flex flex-col items-center text-xs text-slate-400">
            <span>{formatDuration(booking.flight.departs_at, booking.flight.arrives_at)}</span>
            <div className="my-1 flex items-center gap-1">
              <div className="h-px w-8 bg-slate-200" />
              <Plane size={14} className="rotate-90 text-blue-400" />
              <div className="h-px w-8 bg-slate-200" />
            </div>
            <span>{booking.flight.flight_no}</span>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{booking.flight.destination}</p>
            <p className="text-xs text-slate-500">{formatDateTime(booking.flight.arrives_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-4 text-sm">
          <span className="text-slate-500">Seat</span>
          <span className="font-medium">{booking.seat.seat_number} · {booking.seat.class}</span>
          {passenger && (
            <>
              <span className="text-slate-500">Passenger</span>
              <span className="font-medium">{passenger.full_name}</span>
            </>
          )}
          <span className="text-slate-500">Aircraft</span>
          <span className="font-medium">{booking.flight.aircraft_type}</span>
          <span className="text-slate-500 font-semibold">Total Paid</span>
          <span className="font-bold text-blue-600">{formatPrice(booking.total_price)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 p-6 pt-0">
        <Link href="/bookings" className="flex-1">
          <Button variant="secondary" className="w-full gap-2">
            <BookOpen size={16} />
            My Bookings
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button className="w-full">Search More</Button>
        </Link>
      </div>
    </div>
  );
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const bookingId = params.booking;

  if (!bookingId) {
    redirect('/');
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="text-center text-slate-500">Loading your confirmation…</div>
      }>
        <ConfirmationCard bookingId={bookingId} />
      </Suspense>
    </div>
  );
}
