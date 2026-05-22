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
      <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700">
        Failed to load flights. Please try again.
      </div>
    );
  }

  if (!flights?.length) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
        <Plane size={48} className="mx-auto mb-4 rotate-45 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">No flights found</h3>
        <p className="mt-1 text-sm text-slate-500">
          No flights available from {origin} to {destination} on this date.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        {flights.length} flight{flights.length !== 1 ? 's' : ''} found
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      {!hasSearch && (
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Book your next{' '}
            <span className="text-blue-600">flight</span>
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Search from hundreds of flights across India
          </p>
        </div>
      )}

      <div className="mb-8">
        <SearchForm />
      </div>

      {hasSearch && (
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <FlightResults origin={origin} destination={destination} date={date} />
        </Suspense>
      )}
    </div>
  );
}
