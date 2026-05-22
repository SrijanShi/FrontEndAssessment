'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, RefreshCw, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/flightStore';
import type { Booking, Flight, Seat } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { formatDateTime, formatDuration, formatPrice } from '@/lib/utils';

interface BookingCardProps {
  booking: Booking & { flight: Flight; seat: Seat };
}

export function BookingCard({ booking }: BookingCardProps) {
  const router = useRouter();
  const resetBooking = useFlightStore((s) => s.resetBooking);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const isActive = booking.status !== 'cancelled';

  async function handleCancel() {
    setCancelError('');
    setCancelLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: booking.id,
      p_user_id:    user.id,
    });

    if (error) {
      setCancelError(error.message);
      setCancelLoading(false);
      return;
    }

    resetBooking();
    setCancelOpen(false);
    router.refresh();
  }

  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ${isActive ? 'ring-slate-200' : 'ring-slate-100 opacity-75'}`}>
      {/* Top strip with route + status */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-900">{booking.flight.origin}</span>
          <ArrowRight size={14} className="text-slate-400" />
          <span className="text-base font-bold text-slate-900">{booking.flight.destination}</span>
          <span className="text-sm text-slate-400">· {booking.flight.flight_no}</span>
        </div>
        <Badge status={booking.status} />
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Flight info grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Date</p>
            <p className="font-semibold text-slate-900">{formatDateTime(booking.flight.departs_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Duration</p>
            <p className="font-semibold text-slate-900">{formatDuration(booking.flight.departs_at, booking.flight.arrives_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Seat</p>
            <p className="font-semibold capitalize text-slate-900">{booking.seat.seat_number} · {booking.seat.class}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Paid</p>
            <p className="font-bold text-blue-700">{formatPrice(booking.total_price)}</p>
          </div>
        </div>

        {/* PNR + actions */}
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="text-xs text-slate-400">PNR</p>
            <p className="font-mono text-lg font-bold tracking-widest text-slate-900">{booking.pnr_code}</p>
          </div>
          {isActive && (
            <div className="flex gap-2">
              <Link href={`/bookings/${booking.id}/reschedule`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <RefreshCw size={13} />
                  Reschedule
                </Button>
              </Link>
              <Button variant="danger" size="sm" className="gap-1.5" onClick={() => setCancelOpen(true)}>
                <X size={13} />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {cancelError && (
        <div className="mx-5 mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
          {cancelError}
        </div>
      )}

      <ConfirmModal
        open={cancelOpen}
        onClose={() => { setCancelOpen(false); setCancelError(''); }}
        onConfirm={handleCancel}
        title="Cancel Booking"
        message={`Cancel booking ${booking.pnr_code}? This cannot be undone. Cancellations within 2 hours of departure are blocked.`}
        confirmLabel="Yes, Cancel"
        loading={cancelLoading}
      />
    </div>
  );
}
