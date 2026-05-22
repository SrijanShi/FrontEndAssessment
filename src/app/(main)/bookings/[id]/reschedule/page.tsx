'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Booking, Flight, Seat, SeatClass } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SeatMap } from '@/components/seat/SeatMap';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { formatDateTime, formatDuration, formatPrice } from '@/lib/utils';
import { useFlightStore } from '@/store/flightStore';

export default function ReschedulePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const selectedSeat = useFlightStore((s) => s.selectedSeat);
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat);
  const setSelectedFlight = useFlightStore((s) => s.setSelectedFlight);

  const [booking, setBooking] = useState<(Booking & { flight: Flight; seat: Seat }) | null>(null);
  const [altFlights, setAltFlights] = useState<Flight[]>([]);
  const [altSeats, setAltSeats] = useState<Seat[]>([]);
  const [chosenFlight, setChosenFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await supabase
        .from('bookings')
        .select('*, flight:flights(*), seat:seats(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!data) { router.push('/bookings'); return; }
      const b = data as Booking & { flight: Flight; seat: Seat };
      setBooking(b);

      // Fetch alternative flights on same route
      const { data: alts } = await supabase
        .from('flights')
        .select('*')
        .eq('origin', b.flight.origin)
        .eq('destination', b.flight.destination)
        .neq('id', b.flight_id)
        .gte('departs_at', new Date().toISOString())
        .order('departs_at', { ascending: true });

      setAltFlights((alts ?? []) as Flight[]);
      setLoading(false);
    }
    load();
    // Reset seat selection on mount
    setSelectedSeat(null);
  }, [id, router, setSelectedSeat]);

  async function handleFlightSelect(flight: Flight) {
    setChosenFlight(flight);
    setSelectedFlight(flight);
    setSelectedSeat(null);
    const supabase = createClient();
    const { data } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flight.id)
      .order('seat_number', { ascending: true });
    setAltSeats((data ?? []) as Seat[]);
  }

  async function handleConfirmReschedule() {
    if (!booking || !chosenFlight || !selectedSeat) return;
    setConfirming(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fee = Math.max(0, chosenFlight.base_price - booking.flight.base_price);

    const { error: rpcError } = await supabase.rpc('reschedule_booking', {
      p_booking_id:    booking.id,
      p_user_id:       user.id,
      p_new_flight_id: chosenFlight.id,
      p_new_seat_id:   selectedSeat.id,
      p_fee_charged:   fee,
    });

    if (rpcError) {
      setError(rpcError.message);
      setConfirming(false);
      setConfirmOpen(false);
      return;
    }

    setSelectedSeat(null);
    router.push('/bookings');
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!booking) return null;

  const fee = chosenFlight ? Math.max(0, chosenFlight.base_price - booking.flight.base_price) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/bookings" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} />
        Back to My Bookings
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-slate-900">Reschedule Booking</h1>
      <p className="mb-6 text-slate-500">
        Current: <strong>{booking.flight.origin} → {booking.flight.destination}</strong> ·{' '}
        {formatDateTime(booking.flight.departs_at)} · Seat {booking.seat.seat_number}
      </p>

      {/* Step 1: Choose flight */}
      <div className="mb-8">
        <h2 className="mb-4 font-semibold text-slate-700">Step 1: Choose a new flight</h2>
        {altFlights.length === 0 ? (
          <p className="text-slate-500">No alternative flights available on this route.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {altFlights.map((flight) => (
              <button
                key={flight.id}
                type="button"
                onClick={() => handleFlightSelect(flight)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  chosenFlight?.id === flight.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold">{flight.origin}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <ArrowRight size={16} />
                      <span>{formatDuration(flight.departs_at, flight.arrives_at)}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{flight.destination}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge status={flight.status} type="flight" />
                    <p className="mt-1 text-sm text-slate-500">{formatDateTime(flight.departs_at)}</p>
                    <p className="font-bold text-blue-600">{formatPrice(flight.base_price)}</p>
                    {flight.base_price > booking.flight.base_price && (
                      <p className="text-xs text-amber-600">
                        +{formatPrice(flight.base_price - booking.flight.base_price)} fee
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Choose seat */}
      {chosenFlight && altSeats.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-slate-700">Step 2: Choose a new seat</h2>
          <SeatMap flight={chosenFlight} initialSeats={altSeats} />
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Confirm button */}
      {chosenFlight && selectedSeat && (
        <div className="sticky bottom-4 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                New seat: {selectedSeat.seat_number} on {chosenFlight.flight_no}
              </p>
              {fee > 0 && (
                <p className="text-sm text-amber-600">Reschedule fee: +{formatPrice(fee)}</p>
              )}
              {fee === 0 && (
                <p className="text-sm text-green-600">No additional fee</p>
              )}
            </div>
            <Button onClick={() => setConfirmOpen(true)} size="lg" className="gap-2">
              <RefreshCw size={16} />
              Confirm Reschedule
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmReschedule}
        title="Confirm Reschedule"
        message={`Reschedule to ${chosenFlight?.flight_no} — seat ${selectedSeat?.seat_number}?${fee > 0 ? ` An additional fee of ${formatPrice(fee)} will be charged.` : ' No additional fee.'}`}
        confirmLabel="Reschedule"
        confirmVariant="primary"
        loading={confirming}
      />
    </div>
  );
}
