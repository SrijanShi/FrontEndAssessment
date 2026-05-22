import Link from 'next/link';
import { ArrowRight, Clock, Plane } from 'lucide-react';
import type { Flight } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatTime, formatDate, formatDuration, formatPrice } from '@/lib/utils';

interface FlightCardProps {
  flight: Flight;
}

export function FlightCard({ flight }: FlightCardProps) {
  const isBookable = flight.status === 'scheduled' || flight.status === 'delayed';

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Route & Times */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{formatTime(flight.departs_at)}</p>
            <p className="text-sm font-semibold text-blue-600">{flight.origin}</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={12} />
              {formatDuration(flight.departs_at, flight.arrives_at)}
            </div>
            <div className="flex items-center gap-1">
              <div className="h-px w-8 bg-slate-300 sm:w-12" />
              <Plane size={14} className="rotate-90 text-blue-500" />
              <ArrowRight size={14} className="text-slate-400" />
              <div className="h-px w-8 bg-slate-300 sm:w-12" />
            </div>
            <p className="text-xs text-slate-400">{formatDate(flight.departs_at)}</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{formatTime(flight.arrives_at)}</p>
            <p className="text-sm font-semibold text-blue-600">{flight.destination}</p>
          </div>
        </div>

        {/* Pricing & Info */}
        <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="text-xs text-slate-500">from</p>
            <p className="text-2xl font-bold text-blue-600">{formatPrice(flight.base_price)}</p>
            <p className="text-xs text-slate-400">{flight.aircraft_type} · {flight.flight_no}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge status={flight.status} type="flight" />
            {isBookable ? (
              <Link href={`/flights/${flight.id}`}>
                <Button size="sm">Select Seat</Button>
              </Link>
            ) : (
              <Button size="sm" disabled>Unavailable</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
