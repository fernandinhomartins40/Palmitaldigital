import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, MapPin, Navigation, ChevronRight, Loader2 } from 'lucide-react';
import { ridesApi } from '../../services/ridesApi';

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ORIGIN_ICON = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEST_ICON = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36"><path fill="#F04E23" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0zm0 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>`),
  iconSize: [25, 37],
  iconAnchor: [12, 37],
});

interface LatLng { lat: number; lng: number }

function MapClickHandler({ onOrigin, onDest, mode }: {
  onOrigin: (p: LatLng) => void;
  onDest: (p: LatLng) => void;
  mode: 'origin' | 'dest';
}) {
  useMapEvents({
    click(e) {
      if (mode === 'origin') onOrigin(e.latlng);
      else onDest(e.latlng);
    },
  });
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`
    );
    const d = await r.json();
    return d.display_name?.split(',').slice(0, 3).join(', ') ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// Palmital-SP center
const PALMITAL_CENTER: [number, number] = [-22.7867, -50.2144];

export function RideRequestPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'origin' | 'dest'>('origin');
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [dest, setDest] = useState<LatLng | null>(null);
  const [originAddr, setOriginAddr] = useState('');
  const [destAddr, setDestAddr] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(p);
        setOriginAddr(await reverseGeocode(p.lat, p.lng));
        setLocating(false);
        setMode('dest');
      },
      () => setLocating(false)
    );
  };

  const handleOrigin = async (p: LatLng) => {
    setOrigin(p);
    setOriginAddr(await reverseGeocode(p.lat, p.lng));
    setMode('dest');
  };

  const handleDest = async (p: LatLng) => {
    setDest(p);
    setDestAddr(await reverseGeocode(p.lat, p.lng));
  };

  const estimatedPrice = origin && dest
    ? (() => {
        const dlat = dest.lat - origin.lat;
        const dlng = dest.lng - origin.lng;
        const km = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
        return Math.max(5, km * 2.5);
      })()
    : null;

  const request = async () => {
    if (!origin || !dest) return;
    setRequesting(true);
    try {
      const dlat = dest.lat - origin.lat;
      const dlng = dest.lng - origin.lng;
      const distanceMeters = Math.round(Math.sqrt(dlat * dlat + dlng * dlng) * 111000);
      const r = await ridesApi.requestRide({
        originLabel: originAddr,
        destinationLabel: destAddr,
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLat: dest.lat,
        destinationLng: dest.lng,
        distanceMeters,
      });
      navigate(`/rides/track/${r.data.id}`);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto">
      {/* Top panel */}
      <div className="px-4 pt-4 pb-3 space-y-3 z-10 relative">
        <Link to="/rides" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Mobilidade
        </Link>

        <div className="halo halo-cobalt glass rounded-3xl p-3 space-y-2">
          {/* Origin */}
          <button
            onClick={() => setMode('origin')}
            className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all ${
              mode === 'origin' ? 'glass-strong' : 'glass'
            }`}
          >
            <div className="w-3 h-3 rounded-full border-2 border-cobalt flex-shrink-0" />
            <span className={`text-sm flex-1 text-left truncate ${originAddr ? 'text-ink' : 'text-mute'}`}>
              {originAddr || 'Toque no mapa para marcar origem'}
            </span>
            {mode === 'origin' && <span className="chip text-xs" style={{ background: 'var(--cobalt)', color: '#fff' }}>Ativo</span>}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 px-3">
            <div className="flex-1 border-t border-dashed border-cobalt/30" />
          </div>

          {/* Dest */}
          <button
            onClick={() => setMode('dest')}
            className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all ${
              mode === 'dest' ? 'glass-strong' : 'glass'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-coral flex-shrink-0" />
            <span className={`text-sm flex-1 text-left truncate ${destAddr ? 'text-ink' : 'text-mute'}`}>
              {destAddr || 'Toque no mapa para marcar destino'}
            </span>
            {mode === 'dest' && <span className="chip text-xs" style={{ background: 'var(--coral)', color: '#fff' }}>Ativo</span>}
          </button>
        </div>

        {!origin && (
          <button
            onClick={useCurrentLocation}
            disabled={locating}
            className="w-full btn-glass flex items-center justify-center gap-2 text-sm"
            style={{ color: 'var(--cobalt)' }}
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {locating ? 'Localizando...' : 'Usar minha localização'}
          </button>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer
          center={PALMITAL_CENTER}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <MapClickHandler onOrigin={handleOrigin} onDest={handleDest} mode={mode} />
          {origin && <Marker position={[origin.lat, origin.lng]} icon={ORIGIN_ICON} />}
          {dest && <Marker position={[dest.lat, dest.lng]} icon={DEST_ICON} />}
        </MapContainer>

        {/* Map label */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 glass rounded-xl px-3 py-1.5 z-[1000]">
          <p className="text-xs text-ink font-medium">
            {mode === 'origin' ? '📍 Toque para marcar a origem' : '🎯 Toque para marcar o destino'}
          </p>
        </div>
      </div>

      {/* Bottom confirm */}
      {origin && dest && (
        <div className="px-4 py-4 space-y-3">
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="text-sm">
              <p className="text-mute">Estimativa</p>
              <p className="font-bold text-ink text-lg">R$ {estimatedPrice?.toFixed(2)}</p>
            </div>
            <div className="text-right text-sm text-mute">
              <p>Pagamento</p>
              <p className="font-medium text-ink">PIX</p>
            </div>
          </div>
          <button
            onClick={request}
            disabled={requesting}
            className="w-full btn-ink py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--cobalt)', color: '#fff' }}
          >
            {requesting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Procurando motorista...</>
            ) : (
              <>Confirmar corrida <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
