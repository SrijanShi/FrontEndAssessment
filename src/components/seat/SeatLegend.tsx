const items = [
  { color: 'bg-green-400', label: 'Available' },
  { color: 'bg-blue-500', label: 'Selected' },
  { color: 'bg-gray-500', label: 'Occupied' },
  { color: 'bg-amber-400', label: 'Your seat' },
] as const;

export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-4">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`h-5 w-5 rounded ${color}`} />
          <span className="text-sm text-slate-600">{label}</span>
        </div>
      ))}
    </div>
  );
}
