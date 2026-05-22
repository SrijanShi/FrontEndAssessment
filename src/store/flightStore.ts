'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Flight, Seat, BookingStep, PassengerFormData, SearchQuery } from '@/types';

interface FlightStore {
  searchQuery: SearchQuery;
  selectedFlight: Flight | null;
  selectedSeat: Seat | null;
  bookingStep: BookingStep;
  passengerForm: PassengerFormData;

  setSearchQuery: (q: Partial<SearchQuery>) => void;
  setSelectedFlight: (f: Flight | null) => void;
  setSelectedSeat: (s: Seat | null) => void;
  setBookingStep: (step: BookingStep) => void;
  setPassengerForm: (data: Partial<PassengerFormData>) => void;
  resetBooking: () => void;
}

const DEFAULT_SEARCH: SearchQuery = {
  origin: '',
  destination: '',
  date: '',
  passengers: 1,
};

const DEFAULT_PASSENGER: PassengerFormData = {
  full_name: '',
  nationality: '',
  dob: '',
};

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      searchQuery: DEFAULT_SEARCH,
      selectedFlight: null,
      selectedSeat: null,
      bookingStep: 'search',
      passengerForm: DEFAULT_PASSENGER,

      setSearchQuery: (q) =>
        set((state) => ({ searchQuery: { ...state.searchQuery, ...q } })),

      setSelectedFlight: (f) => set({ selectedFlight: f }),

      // Optimistic seat selection — store updates immediately before DB confirms
      setSelectedSeat: (s) => set({ selectedSeat: s }),

      setBookingStep: (step) => set({ bookingStep: step }),

      setPassengerForm: (data) =>
        set((state) => ({ passengerForm: { ...state.passengerForm, ...data } })),

      resetBooking: () =>
        set({
          selectedFlight: null,
          selectedSeat: null,
          bookingStep: 'search',
          passengerForm: DEFAULT_PASSENGER,
        }),
    }),
    {
      name: 'skybook-flight-store',
      // passport_no is never stored — it lives only in React state during form fill
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        bookingStep: state.bookingStep,
        passengerForm: {
          full_name: state.passengerForm.full_name,
          nationality: state.passengerForm.nationality,
          dob: state.passengerForm.dob,
        },
      }),
    }
  )
);
