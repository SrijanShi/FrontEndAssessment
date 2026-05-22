import { Suspense } from 'react';
import { Plane } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SearchForm } from '@/components/search/SearchForm';
import { FlightCard } from '@/components/search/FlightCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Flight } from '@/types';

interface PageProps {
  searchParams: Promise<{ origin?: string; destination?: string; date?: string; passengers?: string }>;
}

async function FlightResults({ origin, destination, date }: { origin: string; destination: string; date: string }) {
  const supabase = await createClient();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: flights, error } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .gte('departs_at', startOfDay.toISOString())
    .lte('departs_at', endOfDay.toISOString())
    .order('departs_at', { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700 ring-1 ring-red-200">
        Failed to load flights. Please try again.
      </div>
    );
  }

  if (!flights?.length) {
    return (
      <div className="rounded-2xl bg-white px-8 py-14 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Plane size={24} className="rotate-45 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No flights found</h3>
        <p className="mt-1 text-sm text-slate-500">
          No flights from <strong>{origin}</strong> to <strong>{destination}</strong> on this date.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-slate-500">
        {flights.length} flight{flights.length !== 1 ? 's' : ''} available
      </p>
      {flights.map((flight: Flight) => (
        <FlightCard key={flight.id} flight={flight} />
      ))}
    </div>
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { origin, destination, date } = params;
  const hasSearch = origin && destination && date;

  return (
    <div>
      {/* Hero band */}
      <div className="bg-blue-700 px-4 pb-10 pt-12">
        <div className="mx-auto max-w-4xl">
          {!hasSearch && (
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Book your next flight
              </h1>
              <p className="mt-2 text-blue-200">
                Search domestic flights across India
              </p>
            </div>
          )}
          <SearchForm />
        </div>
      </div>

      {/* Results */}
      {hasSearch && (
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <FlightResults origin={origin} destination={destination} date={date} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
