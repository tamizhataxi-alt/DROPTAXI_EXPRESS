import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { PlaceSuggestion } from "@/lib/types";

interface LocationInputProps {
  id: string;
  label: string;
  value: string;
  placeId: string;
  placeholder: string;
  dotClassName: string;
  testId: string;
  onType: (text: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
}

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// Pickup / drop search: any street, area or landmark (Google Places via /api/places/autocomplete).
export default function LocationInput({ id, label, value, placeId, placeholder, dotClassName, testId, onType, onSelect }: LocationInputProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [session] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())));
  const boxRef = useRef<HTMLDivElement>(null);
  const term = useDebounced(value.trim(), 250);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["places", term],
    queryFn: () => apiGet<PlaceSuggestion[]>(`/places/autocomplete?q=${encodeURIComponent(term)}&session=${session}`),
    enabled: open && !placeId,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (s: PlaceSuggestion) => {
    onSelect(s);
    setOpen(false);
  };

  const showList = open && !placeId && suggestions.length > 0;

  return (
    <div ref={boxRef} className="relative flex items-center gap-3 px-3 py-1.5">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClassName}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 pr-20">
        <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slateink/85">{label}</label>
        <input
          id={id}
          value={value}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onType(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter") { e.preventDefault(); pick(suggestions[active]); }
            if (e.key === "Escape") setOpen(false);
          }}
          className="h-8 w-full truncate border-0 bg-transparent p-0 text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-slateink/60"
          data-testid={testId}
        />
      </div>
      {isFetching && open && !placeId && <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-slateink/60" aria-hidden="true" />}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-sage bg-white p-1 shadow-[0_20px_50px_-20px_rgba(48,50,61,0.45)]"
          data-testid={`${testId}-suggestions`}
        >
          {suggestions.map((s, i) => (
            <li key={s.place_id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ${i === active ? "bg-accent" : ""}`}
                data-testid={`${testId}-option-${i}`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{s.main_text}</span>
                  {s.secondary_text && <span className="block truncate text-xs text-slateink/80">{s.secondary_text}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
