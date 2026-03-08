import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Loader2, Search, Clock } from "lucide-react";
import clsx from "clsx";
import { venuesApi } from "@/lib/api";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface SavedVenue {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  usageCount: number;
}

interface Suggestion {
  type: "saved" | "nominatim";
  name: string;
  address: string;
  raw?: NominatimResult;
  venue?: SavedVenue;
}

interface AddressAutocompleteProps {
  venueValue: string;
  addressValue: string;
  onVenueChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCoordsChange?: (lat: number | null, lng: number | null) => void;
  className?: string;
}

function formatAddress(result: NominatimResult): string {
  const a = result.address;
  const parts: string[] = [];
  if (a.house_number && a.road) {
    parts.push(`${a.house_number} ${a.road}`);
  } else if (a.road) {
    parts.push(a.road);
  }
  const city = a.city || a.town || a.village;
  if (city) parts.push(city);
  if (a.state) parts.push(a.state);
  if (a.postcode) parts.push(a.postcode);
  return parts.join(", ");
}

export function AddressAutocomplete({
  venueValue,
  addressValue,
  onVenueChange,
  onAddressChange,
  onCoordsChange,
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const allSuggestions: Suggestion[] = [];

    try {
      const venueResult = await venuesApi.search(query);
      for (const v of venueResult.data) {
        allSuggestions.push({
          type: "saved",
          name: v.name,
          address: v.address || "",
          venue: v,
        });
      }
    } catch {
      // saved venues search failed, continue with nominatim
    }

    if (query.length >= 3) {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "5",
          countrycodes: "us",
        });

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          {
            signal: controller.signal,
            headers: { "Accept-Language": "en" },
          },
        );

        if (res.ok) {
          const data: NominatimResult[] = await res.json();
          const savedNames = new Set(allSuggestions.map((s) => s.name.toLowerCase()));
          for (const r of data) {
            const name = r.display_name.split(",")[0]?.trim() || "";
            if (!savedNames.has(name.toLowerCase())) {
              allSuggestions.push({
                type: "nominatim",
                name,
                address: formatAddress(r) || r.display_name,
                raw: r,
              });
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // nominatim failed, show saved results only
        }
      }
    }

    setSuggestions(allSuggestions);
    setShowDropdown(allSuggestions.length > 0);
    setActiveIndex(-1);
    setLoading(false);
  }, []);

  const handleInput = useCallback(
    (field: "venue" | "address", value: string) => {
      if (field === "venue") onVenueChange(value);
      else onAddressChange(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim().length >= 2) {
          search(value.trim());
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      }, 350);
    },
    [onVenueChange, onAddressChange, search],
  );

  const selectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      onVenueChange(suggestion.name);
      onAddressChange(suggestion.address);

      if (onCoordsChange) {
        if (suggestion.raw) {
          onCoordsChange(parseFloat(suggestion.raw.lat), parseFloat(suggestion.raw.lon));
        } else if (suggestion.venue) {
          onCoordsChange(suggestion.venue.latitude, suggestion.venue.longitude);
        } else {
          onCoordsChange(null, null);
        }
      }

      setSuggestions([]);
      setShowDropdown(false);
    },
    [onVenueChange, onAddressChange, onCoordsChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    },
    [showDropdown, suggestions, activeIndex, selectSuggestion],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100";

  const savedSuggestions = suggestions.filter((s) => s.type === "saved");
  const nominatimSuggestions = suggestions.filter((s) => s.type === "nominatim");

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="venueName"
            className="mb-1.5 block text-sm font-semibold text-gray-700"
          >
            Venue Name
          </label>
          <div className="relative">
            <input
              id="venueName"
              type="text"
              value={venueValue}
              onChange={(e) => handleInput("venue", e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              className={inputCls}
              placeholder="David Street Station"
              autoComplete="off"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
            )}
            {!loading && venueValue.length >= 2 && (
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="address"
            className="mb-1.5 block text-sm font-semibold text-gray-700"
          >
            Address
          </label>
          <input
            id="address"
            type="text"
            value={addressValue}
            onChange={(e) => handleInput("address", e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            className={inputCls}
            placeholder="123 Main St, Casper, WY"
            autoComplete="off"
          />
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/50 animate-fade-in">
          {savedSuggestions.length > 0 && (
            <>
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Previously used venues
                </p>
              </div>
              {savedSuggestions.map((s, i) => {
                const globalIdx = i;
                return (
                  <button
                    key={`saved-${s.venue?.id}`}
                    type="button"
                    className={clsx(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      globalIdx === activeIndex
                        ? "bg-primary-50"
                        : "hover:bg-gray-50",
                    )}
                    onClick={() => selectSuggestion(s)}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                      {s.address && (
                        <p className="text-xs text-gray-500 truncate">{s.address}</p>
                      )}
                    </div>
                    <span className="ml-auto text-[10px] text-gray-400 whitespace-nowrap">
                      used {s.venue?.usageCount ?? 1}x
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {nominatimSuggestions.length > 0 && (
            <>
              <div className={clsx("px-3 py-2 border-b border-gray-100", savedSuggestions.length > 0 && "border-t")}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Suggested locations
                </p>
              </div>
              {nominatimSuggestions.map((s, i) => {
                const globalIdx = savedSuggestions.length + i;
                return (
                  <button
                    key={`nom-${s.raw?.place_id}`}
                    type="button"
                    className={clsx(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      globalIdx === activeIndex
                        ? "bg-primary-50"
                        : "hover:bg-gray-50",
                    )}
                    onClick={() => selectSuggestion(s)}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 truncate">{s.address}</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          <div className="border-t border-gray-100 px-3 py-1.5">
            <p className="text-[10px] text-gray-400">
              Powered by OpenStreetMap
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
