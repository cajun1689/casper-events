import { useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { EventWithDetails } from "@cyh/shared";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface MapViewProps {
  events: EventWithDetails[];
  onEventClick?: (eventId: string) => void;
}

const DEFAULT_CENTER: [number, number] = [-106.3131, 42.8666]; // Casper, WY [lng, lat]

function resolveColor(event: EventWithDetails): string {
  if (event.color) return event.color;
  const cats = event.orgCategories?.length ? event.orgCategories : event.categories ?? [];
  if (cats.length > 0 && cats[0].color) return cats[0].color;
  return "#4f46e5";
}

function getSolidForMarker(value: string): string {
  if (!value || value.trim().startsWith("linear-gradient")) {
    const match = value?.match(/#[0-9a-fA-F]{3,6}/);
    return match ? match[0] : "#4f46e5";
  }
  return value;
}

export function MapView({ events, onEventClick }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const withCoords = events.filter(
    (e) => e.latitude != null && e.longitude != null && !Number.isNaN(e.latitude) && !Number.isNaN(e.longitude)
  );
  const coordsKey = withCoords.map((e) => `${e.id}`).sort().join(",");

  useEffect(() => {
    if (!mapContainerRef.current || withCoords.length === 0) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: DEFAULT_CENTER,
      zoom: 10,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-left");

    const markers: maplibregl.Marker[] = [];
    for (const event of withCoords) {
      const color = getSolidForMarker(resolveColor(event));
      const el = document.createElement("div");
      el.className = "event-marker";
      el.style.cssText = `
        width: 24px; height: 24px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([event.longitude!, event.latitude!])
        .addTo(map);

      el.addEventListener("click", () => {
        onEventClick?.(event.id);
        const title = escapeHtml(event.title);
        const venue = event.venueName ? escapeHtml(event.venueName) : "";
        const timeStr = format(parseISO(event.startAt), "EEE, MMM d") + (event.allDay ? " · All day" : ` · ${format(parseISO(event.startAt), "h:mm a")}`);
        new maplibregl.Popup({ offset: 25 })
          .setLngLat([event.longitude!, event.latitude!])
          .setHTML(
            `<div class="min-w-[200px]">
              <a href="/events/${event.id}" class="font-bold text-gray-900 hover:text-indigo-600">${title}</a>
              <p class="mt-1 text-sm text-gray-600">${timeStr}</p>
              ${venue ? `<p class="mt-0.5 text-xs text-gray-500">${venue}</p>` : ""}
            </div>`
          )
          .addTo(map);
      });

      markers.push(marker);
    }

    if (withCoords.length === 1) {
      map.flyTo({ center: [withCoords[0].longitude!, withCoords[0].latitude!], zoom: 14 });
    } else {
      const lngs = withCoords.map((e) => e.longitude!);
      const lats = withCoords.map((e) => e.latitude!);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 40, maxZoom: 14 }
      );
    }

    mapRef.current = map;
    markersRef.current = markers;

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, [coordsKey, onEventClick]);

  if (events.length === 0) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-2xl border border-gray-200/60 bg-gray-50/50">
        <p className="text-center text-gray-500">No events to display on the map.</p>
      </div>
    );
  }

  if (withCoords.length === 0) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-2xl border border-gray-200/60 bg-gray-50/50">
        <p className="text-center text-gray-500">
          No events with map locations. Add latitude/longitude to event venues to see them on the map.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-2xl border border-gray-200/60 bg-gray-50/50">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
