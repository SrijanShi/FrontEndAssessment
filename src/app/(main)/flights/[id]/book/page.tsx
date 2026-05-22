'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/flightStore';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatTime, formatDate, formatDuration } from '@/lib/utils';

const NATIONALITIES = [
  'Indian', 'American', 'British', 'Australian', 'Canadian',
  'German', 'French', 'Japanese', 'Chinese', 'Singaporean', 'Other',
];

export default function BookPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const selectedFlight = useFlightStore((s) => s.selectedFlight);
  const selectedSeat = useFlightStore((s) => s.selectedSeat);
  const passengerForm = useFlightStore((s) => s.passengerForm);
  const setPassengerForm = useFlightStore((s) => s.setPassengerForm);
  const resetBooking = useFlightStore((s) => s.resetBooking);

  const [passportNo, setPassportNo] = useState(''); // NOT persisted
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedFlight || !selectedSeat) {
      router.replace(`/flights/${id}`);
    }
  }, [selectedFlight, selectedSeat, id, router]);

  if (!selectedFlight || !selectedSeat) return null;

  const totalPrice = selectedFlight.base_price + selectedSeat.extra_fee;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=/flights/${id}/book`);
      return;
    }

    if (!selectedFlight || !selectedSeat) {
      setLoading(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc('reserve_seat', {
      p_flight_id:   selectedFlight.id,
      p_seat_id:     selectedSeat.id,
      p_user_id:     user.id,
      p_total_price: totalPrice,
      p_passenger: {
        full_name:   passengerForm.full_name,
        passport_no: passportNo,
        nationality: passengerForm.nationality,
        dob:         passengerForm.dob,
      },
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    resetBooking();
    router.push(`/confirmation?pnr=${data.pnr_code}&booking=${data.booking_id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/flights/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        Back to seat selection
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">Passenger Details</h1>

      {/* Booking summary */}
      <div className="mb-6 rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-200">
        <h2 className="mb-3 font-semibold text-slate-800">Booking Summary</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-slate-500">Flight</span>
          <span className="font-medium">{selectedFlight.flight_no}</span>
          <span className="text-slate-500">Route</span>
          <span className="font-medium">{selectedFlight.origin} → {selectedFlight.destination}</span>
          <span className="text-slate-500">Date</span>
          <span className="font-medium">{formatDate(selectedFlight.departs_at)}</span>
          <span className="text-slate-500">Time</span>
          <span className="font-medium">{formatTime(selectedFlight.departs_at)} → {formatTime(selectedFlight.arrives_at)}</span>
          <span className="text-slate-500">Duration</span>
          <span className="font-medium">{formatDuration(selectedFlight.departs_at, selectedFlight.arrives_at)}</span>
          <span className="text-slate-500">Seat</span>
          <span className="font-medium">{selectedSeat.seat_number} ({selectedSeat.class})</span>
          <span className="text-slate-500 font-semibold">Total</span>
          <span className="font-bold text-blue-700 text-lg">{formatPrice(totalPrice)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center gap-2 text-slate-700">
          <User size={18} />
          <h2 className="font-semibold">Passenger Information</h2>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            id="full_name"
            label="Full Name (as per passport)"
            value={passengerForm.full_name}
            onChange={(e) => setPassengerForm({ full_name: e.target.value })}
            placeholder="John Doe"
            required
          />

          <Input
            id="passport_no"
            label="Passport Number"
            value={passportNo}
            onChange={(e) => setPassportNo(e.target.value)}
            placeholder="A1234567"
            required
            autoComplete="off"
          />
          <p className="text-xs text-slate-400 -mt-2">
            Passport number is not stored locally for your security.
          </p>

          <Select
            id="nationality"
            label="Nationality"
            value={passengerForm.nationality}
            onChange={(e) => setPassengerForm({ nationality: e.target.value })}
            required
          >
            <option value="">Select nationality</option>
            {NATIONALITIES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>

          <Input
            id="dob"
            label="Date of Birth"
            type="date"
            value={passengerForm.dob}
            onChange={(e) => setPassengerForm({ dob: e.target.value })}
            max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
            required
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5">
          <CreditCard size={18} className="text-slate-400" />
          <p className="flex-1 text-sm text-slate-500">
            Total: <strong className="text-slate-900">{formatPrice(totalPrice)}</strong>
          </p>
          <Button type="submit" loading={loading} size="lg">
            Confirm Booking
          </Button>
        </div>
      </form>
    </div>
  );
}
