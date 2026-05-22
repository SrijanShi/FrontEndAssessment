'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';
import { AIRPORTS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

export function SearchForm() {
  const router = useRouter();
  const searchQuery = useFlightStore((s) => s.searchQuery);
  const setSearchQuery = useFlightStore((s) => s.setSearchQuery);

  const today = new Date().toISOString().split('T')[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      origin:      searchQuery.origin,
      destination: searchQuery.destination,
      date:        searchQuery.date,
      passengers:  String(searchQuery.passengers),
    });
    router.push(`/?${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          id="origin"
          label="From"
          value={searchQuery.origin}
          onChange={(e) => setSearchQuery({ origin: e.target.value })}
          required
        >
          <option value="">Select origin</option>
          {AIRPORTS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.code} — {a.city}
            </option>
          ))}
        </Select>

        <Select
          id="destination"
          label="To"
          value={searchQuery.destination}
          onChange={(e) => setSearchQuery({ destination: e.target.value })}
          required
        >
          <option value="">Select destination</option>
          {AIRPORTS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.code} — {a.city}
            </option>
          ))}
        </Select>

        <Input
          id="date"
          label="Date"
          type="date"
          value={searchQuery.date}
          min={today}
          onChange={(e) => setSearchQuery({ date: e.target.value })}
          required
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="passengers" className="text-sm font-medium text-slate-700">
            Passengers
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <button
              type="button"
              onClick={() => setSearchQuery({ passengers: Math.max(1, searchQuery.passengers - 1) })}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              −
            </button>
            <span id="passengers" className="flex-1 text-center text-sm font-medium">
              {searchQuery.passengers}
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery({ passengers: Math.min(9, searchQuery.passengers + 1) })}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" size="lg" className="gap-2 px-8">
          <Search size={18} />
          Search Flights
        </Button>
      </div>
    </form>
  );
}
