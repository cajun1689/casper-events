import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EventWithDetails } from "@cyh/shared";

// Fix default marker icons in React-Leaflet (webpack/vite)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapViewProps {
  events: EventWithDetails[];
  onEventClick?: (eventId: string) => void;
}

function MapBounds({ events }: { events: EventWithDetails[] }) {
  const map = useMap();
  const withCoords = events.filter(
    (e) => e.latitude != null && e.longitude != null && !Number.isNaN(e.latitude) && !Number.isNaN(e.longitude)
  );
  useEffect(() => {
    if (withCoords.length === 0) return;
    if (withCoords.length === 1) {
      map.setView([withCoords[0].latitude!, withCoords[0].longitude!], 14);
    } else {
      const bounds = L.latLngBounds(
        withCoords.map((e) => [e.latitude!, e.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, withCoords]);
  return null;
}

export function MapView({ events, onEventClick }: MapViewProps) {
  const withCoords = events.filter(
    (e) => e.latitude != null && e.longitude != null && !Number.isNaN(e.latitude) && !Number.isNaN(e.longitude)
  );

  const defaultCenter: [number, number] = [42.8666, -106.3131]; // Casper, WY

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
      <MapContainer
        center={defaultCenter}
        zoom={10}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.length > 0 && <MapBounds events={withCoords} />}
        {withCoords.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude!, event.longitude!]}
            eventHandlers={{
              click: () => onEventClick?.(event.id),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <Link
                  to={`/events/${event.id}`}
                  className="font-bold text-gray-900 hover:text-primary-600"
                >
                  {event.title}
                </Link>
                <p className="mt-1 text-sm text-gray-600">
                  {format(parseISO(event.startAt), "EEE, MMM d")}
                  {event.allDay ? " · All day" : ` · ${format(parseISO(event.startAt), "h:mm a")}`}
                </p>
                {event.venueName && (
                  <p className="mt-0.5 text-xs text-gray-500">{event.venueName}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
