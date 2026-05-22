'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plane, Calendar, Armchair, Hash, X, RefreshCw } from 'lucide-react';
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
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: route info */}
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Plane size={18} className="rotate-45" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {booking.flight.origin} → {booking.flight.destination}
              </p>
              <p className="text-sm text-slate-500">{booking.flight.flight_no}</p>
            </div>
            <Badge status={booking.status} />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar size={14} />
              <span>{formatDateTime(booking.flight.departs_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Armchair size={14} />
              <span>Seat {booking.seat.seat_number} · {booking.seat.class}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Hash size={14} />
              <span className="font-mono font-semibold text-slate-700">{booking.pnr_code}</span>
            </div>
            <div className="text-slate-500">
              Duration: {formatDuration(booking.flight.departs_at, booking.flight.arrives_at)}
            </div>
          </div>

          <p className="mt-3 font-semibold text-blue-600">{formatPrice(booking.total_price)}</p>
        </div>

        {/* Right: actions */}
        {isActive && (
          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            <Link href={`/bookings/${booking.id}/reschedule`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <RefreshCw size={14} />
                Reschedule
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              className="gap-1.5"
              onClick={() => setCancelOpen(true)}
            >
              <X size={14} />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={cancelOpen}
        onClose={() => { setCancelOpen(false); setCancelError(''); }}
        onConfirm={handleCancel}
        title="Cancel Booking"
        message={`Are you sure you want to cancel booking ${booking.pnr_code}? This action cannot be undone. Cancellations within 2 hours of departure are not allowed.`}
        confirmLabel="Yes, Cancel"
        loading={cancelLoading}
      />

      {cancelError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {cancelError}
        </p>
      )}
    </div>
  );
}
