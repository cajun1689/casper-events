function cleanAddress(raw: string): string {
  const parenMatch = raw.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1];
  return raw;
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const cleaned = cleanAddress(address);
    const params = new URLSearchParams({
      q: cleaned,
      format: "json",
      limit: "1",
      countrycodes: "us",
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "CasperEventsCalendar/1.0", "Accept-Language": "en" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
