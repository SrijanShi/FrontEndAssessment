'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Shield } from 'lucide-react';
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

  const [passportNo, setPassportNo] = useState('');
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
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} />
        Back to seat selection
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">Passenger Details</h1>

      {/* Booking summary — boarding-pass style */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="bg-blue-700 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Booking Summary</p>
        </div>
        <div className="px-5 py-4">
          {/* Route row */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">{selectedFlight.origin}</p>
              <p className="text-xs text-slate-500">{formatTime(selectedFlight.departs_at)}</p>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-xs text-slate-400">
              <span>{formatDuration(selectedFlight.departs_at, selectedFlight.arrives_at)}</span>
              <div className="flex items-center gap-1">
                <div className="h-px w-10 bg-slate-200" />
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <div className="h-px w-10 bg-slate-200" />
              </div>
              <span>{selectedFlight.flight_no}</span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">{selectedFlight.destination}</p>
              <p className="text-xs text-slate-500">{formatTime(selectedFlight.arrives_at)}</p>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t border-dashed border-slate-200 pt-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Date</p>
              <p className="font-semibold text-slate-900">{formatDate(selectedFlight.departs_at)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Seat</p>
              <p className="font-semibold text-slate-900 capitalize">{selectedSeat.seat_number} · {selectedSeat.class}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Aircraft</p>
              <p className="font-semibold text-slate-900">{selectedFlight.aircraft_type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Fare</p>
              <p className="text-lg font-bold text-blue-700">{formatPrice(totalPrice)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Passenger form */}
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <User size={17} className="text-blue-600" />
            <h2 className="font-semibold text-slate-900">Passenger Information</h2>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <Input
            id="full_name"
            label="Full Name (as per passport)"
            value={passengerForm.full_name}
            onChange={(e) => setPassengerForm({ full_name: e.target.value })}
            placeholder="John Doe"
            required
          />

          <div>
            <Input
              id="passport_no"
              label="Passport Number"
              value={passportNo}
              onChange={(e) => setPassportNo(e.target.value)}
              placeholder="A1234567"
              required
              autoComplete="off"
            />
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <Shield size={11} />
              Not stored locally for your security
            </p>
          </div>

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
          <div className="mx-6 mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs text-slate-400">Total payable</p>
            <p className="text-xl font-bold text-slate-900">{formatPrice(totalPrice)}</p>
          </div>
          <Button type="submit" loading={loading} size="lg">
            Confirm Booking
          </Button>
        </div>
      </form>
    </div>
  );
}
