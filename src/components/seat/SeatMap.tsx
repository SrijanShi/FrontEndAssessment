'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/flightStore';
import { Button } from '@/components/ui/Button';
import { SeatLegend } from './SeatLegend';
import { formatPrice } from '@/lib/utils';
import type { Seat, SeatClass, Flight } from '@/types';

const CLASS_LABELS: Record<SeatClass, string> = {
  first:    'First Class',
  business: 'Business Class',
  economy:  'Economy Class',
};

const CLASS_COLORS: Record<SeatClass, string> = {
  first:    'bg-purple-100 border-purple-200',
  business: 'bg-blue-50 border-blue-100',
  economy:  'bg-slate-50 border-slate-100',
};

interface SeatMapProps {
  flight: Flight;
  initialSeats: Seat[];
  bookedSeatId?: string;
}

export function SeatMap({ flight, initialSeats, bookedSeatId }: SeatMapProps) {
  const router = useRouter();
  const selectedSeat = useFlightStore((s) => s.selectedSeat);
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat);
  const setSelectedFlight = useFlightStore((s) => s.setSelectedFlight);

  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [tooltip, setTooltip] = useState<{ seat: Seat; x: number; y: number } | null>(null);

  // Supabase Realtime — live seat availability
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`seats:${flight.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'seats', filter: `flight_id=eq.${flight.id}` },
        (payload) => {
          setSeats((prev) =>
            prev.map((s) => (s.id === payload.new.id ? (payload.new as Seat) : s))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [flight.id]);

  const handleSelect = useCallback(
    (seat: Seat) => {
      if (!seat.is_available) return;
      // Optimistic update — store reflects selection before DB write
      setSelectedSeat(selectedSeat?.id === seat.id ? null : seat);
    },
    [selectedSeat, setSelectedSeat]
  );

  function handleProceed() {
    if (!selectedSeat) return;
    setSelectedFlight(flight);
    router.push(`/flights/${flight.id}/book`);
  }

  // Group seats by class
  const grouped = seats.reduce<Record<SeatClass, Seat[]>>(
    (acc, seat) => { acc[seat.class].push(seat); return acc; },
    { first: [], business: [], economy: [] }
  );

  const classOrder: SeatClass[] = ['first', 'business', 'economy'];

  return (
    <div className="flex flex-col gap-6">
      <SeatLegend />

      <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        {/* Aircraft nose decoration */}
        <div className="mb-6 flex justify-center">
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <div className="h-12 w-24 rounded-t-full border-2 border-dashed border-slate-200" />
            <span className="text-xs">FRONT</span>
          </div>
        </div>

        <div className="flex flex-col gap-8 px-2">
          {classOrder.map((cls) => {
            const classSeats = grouped[cls];
            if (!classSeats.length) return null;

            // Determine columns (first=4, others=6)
            const cols = cls === 'first' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E', 'F'];
            const rows = [...new Set(classSeats.map((s) => s.seat_number.replace(/[A-Z]/g, '')))].sort(
              (a, b) => parseInt(a) - parseInt(b)
            );

            return (
              <div key={cls} className={cn('rounded-xl border-2 p-4', CLASS_COLORS[cls])}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700">{CLASS_LABELS[cls]}</h3>
                  {classSeats[0] && classSeats[0].extra_fee > 0 && (
                    <span className="text-xs text-slate-500">
                      +{formatPrice(classSeats[0].extra_fee)} fee
                    </span>
                  )}
                </div>

                {/* Column labels */}
                <div
                  className="mb-1 grid gap-1 text-center text-xs font-medium text-slate-400"
                  style={{ gridTemplateColumns: `2rem repeat(${Math.ceil(cols.length / 2)}, minmax(2.5rem, 1fr)) 0.5rem repeat(${Math.floor(cols.length / 2)}, minmax(2.5rem, 1fr))` }}
                >
                  <div />
                  {cols.slice(0, Math.ceil(cols.length / 2)).map((c) => <div key={c}>{c}</div>)}
                  <div />
                  {cols.slice(Math.ceil(cols.length / 2)).map((c) => <div key={c}>{c}</div>)}
                </div>

                {/* Seat rows */}
                {rows.map((row) => (
                  <div
                    key={row}
                    className="mb-1 grid gap-1"
                    style={{ gridTemplateColumns: `2rem repeat(${Math.ceil(cols.length / 2)}, minmax(2.5rem, 1fr)) 0.5rem repeat(${Math.floor(cols.length / 2)}, minmax(2.5rem, 1fr))` }}
                  >
                    <span className="flex items-center justify-center text-xs text-slate-400">
                      {row}
                    </span>
                    {cols.slice(0, Math.ceil(cols.length / 2)).map((col) => {
                      const seat = classSeats.find((s) => s.seat_number === row + col);
                      return seat ? (
                        <SeatButton
                          key={seat.id}
                          seat={seat}
                          isSelected={selectedSeat?.id === seat.id}
                          isBooked={bookedSeatId === seat.id}
                          onSelect={handleSelect}
                          onTooltip={setTooltip}
                        />
                      ) : <div key={col} />;
                    })}
                    {/* Aisle */}
                    <div />
                    {cols.slice(Math.ceil(cols.length / 2)).map((col) => {
                      const seat = classSeats.find((s) => s.seat_number === row + col);
                      return seat ? (
                        <SeatButton
                          key={seat.id}
                          seat={seat}
                          isSelected={selectedSeat?.id === seat.id}
                          isBooked={bookedSeatId === seat.id}
                          onSelect={handleSelect}
                          onTooltip={setTooltip}
                        />
                      ) : <div key={col} />;
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{ top: tooltip.y + 12, left: tooltip.x + 12 }}
        >
          <p className="font-semibold">{tooltip.seat.seat_number} · {CLASS_LABELS[tooltip.seat.class]}</p>
          {tooltip.seat.extra_fee > 0 && <p>+{formatPrice(tooltip.seat.extra_fee)}</p>}
          {!tooltip.seat.is_available && <p className="text-red-300">Occupied</p>}
        </div>
      )}

      {/* Proceed button */}
      <div className="sticky bottom-4">
        <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            {selectedSeat ? (
              <div>
                <p className="font-semibold text-slate-900">
                  Seat {selectedSeat.seat_number} selected
                </p>
                <p className="text-sm text-slate-500">
                  {CLASS_LABELS[selectedSeat.class]}
                  {selectedSeat.extra_fee > 0 && ` · +${formatPrice(selectedSeat.extra_fee)}`}
                </p>
              </div>
            ) : (
              <p className="text-slate-500">Select a seat to continue</p>
            )}
            <Button onClick={handleProceed} disabled={!selectedSeat} size="lg">
              Proceed to Book
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SeatButtonProps {
  seat: Seat;
  isSelected: boolean;
  isBooked: boolean;
  onSelect: (seat: Seat) => void;
  onTooltip: (t: { seat: Seat; x: number; y: number } | null) => void;
}

function SeatButton({ seat, isSelected, isBooked, onSelect, onTooltip }: SeatButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(seat)}
      onMouseEnter={(e) => onTooltip({ seat, x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => onTooltip({ seat, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => onTooltip(null)}
      disabled={!seat.is_available && !isBooked}
      aria-label={`Seat ${seat.seat_number} ${seat.is_available ? 'available' : 'occupied'}`}
      className={cn(
        'flex min-h-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-md text-xs font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        isBooked
          ? 'bg-amber-400 text-white'
          : isSelected
          ? 'bg-blue-500 text-white scale-105 shadow-md'
          : seat.is_available
          ? 'bg-green-400 text-white hover:bg-green-500 cursor-pointer'
          : 'bg-gray-400 text-white cursor-not-allowed opacity-70'
      )}
    >
      {seat.seat_number}
    </button>
  );
}
