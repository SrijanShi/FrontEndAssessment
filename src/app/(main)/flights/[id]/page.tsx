import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Plane } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SeatMap } from '@/components/seat/SeatMap';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, formatDuration, formatPrice } from '@/lib/utils';
import type { Flight, Seat } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FlightDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: flight }, { data: seats }] = await Promise.all([
    supabase.from('flights').select('*').eq('id', id).single(),
    supabase
      .from('seats')
      .select('*')
      .eq('flight_id', id)
      .order('seat_number', { ascending: true }),
  ]);

  if (!flight) notFound();

  const f = flight as Flight;
  const s = (seats ?? []) as Seat[];

  const available = s.filter((seat) => seat.is_available).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        Back to search
      </Link>

      {/* Flight summary card */}
      <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{f.origin}</p>
              <p className="text-sm text-slate-500">{formatDateTime(f.departs_at)}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock size={14} />
                {formatDuration(f.departs_at, f.arrives_at)}
              </div>
              <div className="my-1 flex items-center gap-1">
                <div className="h-px w-12 bg-slate-200" />
                <Plane size={16} className="rotate-90 text-blue-500" />
                <div className="h-px w-12 bg-slate-200" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{f.destination}</p>
              <p className="text-sm text-slate-500">{formatDateTime(f.arrives_at)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-right">
            <Badge status={f.status} type="flight" />
            <p className="text-sm text-slate-500">{f.aircraft_type} · {f.flight_no}</p>
            <p className="text-xl font-bold text-blue-600">from {formatPrice(f.base_price)}</p>
            <p className="text-sm text-slate-500">{available} seats available</p>
          </div>
        </div>
      </div>

      {/* Seat map */}
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Select Your Seat</h2>
      <SeatMap flight={f} initialSeats={s} />
    </div>
  );
}
