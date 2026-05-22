import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Armchair, User, Plane } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatDuration, formatPrice, formatTime } from '@/lib/utils';
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
    <div className="w-full max-w-md">
      {/* Success badge */}
      <div className="mb-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={36} className="text-green-600" />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Booking Confirmed</h1>
        <p className="mt-1 text-sm text-slate-500">Your itinerary is ready</p>
      </div>

      {/* Boarding pass card */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200">
        {/* PNR header */}
        <div className="bg-blue-700 px-6 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">PNR Code</p>
          <p className="mt-1 font-mono text-5xl font-bold tracking-[0.25em] text-white">
            {booking.pnr_code}
          </p>
        </div>

        {/* Route */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="text-center">
            <p className="text-4xl font-bold text-slate-900">{booking.flight.origin}</p>
            <p className="mt-0.5 text-sm text-slate-500">{formatTime(booking.flight.departs_at)}</p>
          </div>
          <div className="flex flex-col items-center gap-1 text-xs text-slate-400">
            <span>{formatDuration(booking.flight.departs_at, booking.flight.arrives_at)}</span>
            <div className="flex items-center gap-1">
              <div className="h-px w-8 bg-slate-200" />
              <Plane size={14} className="rotate-90 text-blue-500" />
              <ArrowRight size={12} className="text-slate-300" />
              <div className="h-px w-8 bg-slate-200" />
            </div>
            <span>{booking.flight.flight_no}</span>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-slate-900">{booking.flight.destination}</p>
            <p className="mt-0.5 text-sm text-slate-500">{formatTime(booking.flight.arrives_at)}</p>
          </div>
        </div>

        {/* Tear line */}
        <div className="flex items-center gap-0">
          <div className="-ml-3 h-6 w-6 rounded-full bg-slate-100 ring-1 ring-slate-200" />
          <div className="flex-1 border-t border-dashed border-slate-200" />
          <div className="-mr-3 h-6 w-6 rounded-full bg-slate-100 ring-1 ring-slate-200" />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <div>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Armchair size={11} /> Seat
            </p>
            <p className="mt-0.5 font-semibold capitalize text-slate-900">
              {booking.seat.seat_number} · {booking.seat.class}
            </p>
          </div>
          {passenger && (
            <div>
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <User size={11} /> Passenger
              </p>
              <p className="mt-0.5 font-semibold text-slate-900">{passenger.full_name}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400">Date</p>
            <p className="mt-0.5 font-semibold text-slate-900">{formatDateTime(booking.flight.departs_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Paid</p>
            <p className="mt-0.5 text-lg font-bold text-blue-700">{formatPrice(booking.total_price)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <Link href="/bookings" className="flex-1">
            <Button variant="secondary" className="w-full">My Bookings</Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full">Book Another</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const bookingId = params.booking;

  if (!bookingId) redirect('/');

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="text-center text-sm text-slate-500">Loading confirmation…</div>
      }>
        <ConfirmationCard bookingId={bookingId} />
      </Suspense>
    </div>
  );
}
