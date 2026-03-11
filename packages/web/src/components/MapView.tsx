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
  const popupRef = useRef<maplibregl.Popup | null>(null);

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
    const markerLngLats: [number, number][] = [];
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

      markers.push(marker);
      markerLngLats.push([event.longitude!, event.latitude!]);
    }

    function showPopupForEvent(event: (typeof withCoords)[0]) {
      onEventClick?.(event.id);
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      const title = escapeHtml(event.title);
      const venue = event.venueName ? escapeHtml(event.venueName) : "";
      const timeStr = format(parseISO(event.startAt), "EEE, MMM d") + (event.allDay ? " · All day" : ` · ${format(parseISO(event.startAt), "h:mm a")}`);
      const cats = (event.categories ?? []).map((c) => escapeHtml(c.name)).join(", ");
      const imgUrl = event.imageUrl?.trim();
      const imgHtml = imgUrl
        ? `<a href="/events/${event.id}" style="display:block;margin-bottom:8px;border-radius:8px;overflow:hidden;width:140px;height:94px"><img src="${escapeHtml(imgUrl)}" alt="" style="width:140px;height:94px;object-fit:cover;display:block" /></a>`
        : "";
      const popup = new maplibregl.Popup({ offset: 25, closeButton: true })
        .setLngLat([event.longitude!, event.latitude!])
        .setHTML(
          `<div style="min-width:220px;font-family:system-ui,sans-serif">
            ${imgHtml}
            <a href="/events/${event.id}" style="font-weight:600;font-size:15px;color:#1f2937;text-decoration:none;display:block" onmouseover="this.style.color='#4f46e5'" onmouseout="this.style.color='#1f2937'">${title}</a>
            <p style="margin:6px 0 0;font-size:13px;color:#6b7280">${timeStr}</p>
            ${venue ? `<p style="margin:2px 0 0;font-size:12px;color:#9ca3af">${venue}</p>` : ""}
            ${cats ? `<p style="margin:4px 0 0;font-size:11px;color:#9ca3af">${cats}</p>` : ""}
            <a href="/events/${event.id}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#4f46e5;text-decoration:none">View details →</a>
          </div>`
        )
        .addTo(map);
      popupRef.current = popup;
      popup.on("close", () => { popupRef.current = null; });
    }

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const clickPoint = e.point;
      const hitRadius = 25;
      let closestEvent: (typeof withCoords)[0] | null = null;
      let closestDist = Infinity;

      for (let i = 0; i < withCoords.length; i++) {
        const lngLat = markerLngLats[i];
        const screenPoint = map.project(lngLat);
        const dx = clickPoint.x - screenPoint.x;
        const dy = clickPoint.y - screenPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < hitRadius && dist < closestDist) {
          closestDist = dist;
          closestEvent = withCoords[i];
        }
      }

      if (closestEvent) {
        e.originalEvent?.preventDefault?.();
        showPopupForEvent(closestEvent);
      }
    };

    map.on("click", handleMapClick);

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
      map.off("click", handleMapClick);
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
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
    <div className="map-view-container h-[500px] w-full overflow-hidden rounded-2xl border border-gray-200/60 bg-gray-50/50">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
