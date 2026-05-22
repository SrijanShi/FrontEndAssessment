export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
        <svg
          className="h-10 w-10 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.143 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-slate-900">You&apos;re offline</h1>
      <p className="mb-6 max-w-sm text-slate-500">
        No internet connection detected. Your previously loaded bookings may still be
        available — check the My Bookings section.
      </p>

      <div className="flex gap-3">
        <a
          href="/bookings"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          My Bookings
        </a>
        <a
          href="/"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}
