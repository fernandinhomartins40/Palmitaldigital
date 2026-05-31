import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, ToggleLeft, ToggleRight, MapPin, Car, Check, X, Navigation } from 'lucide-react';
import { ridesApi, type Ride, type Driver } from '../../services/ridesApi';
import { useDriverSocket } from '../../hooks/useRides';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PALMITAL_CENTER: [number, number] = [-22.7867, -50.2144];

function PendingRideCard({ ride, onAccept, onReject }: {
  ride: Ride;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="halo halo-cobalt glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Car className="w-5 h-5 text-cobalt" />
        <span className="font-semibold text-ink text-sm">Nova corrida!</span>
        {ride.estimatedPrice && (
          <span className="ml-auto font-bold text-ink">R$ {ride.estimatedPrice.toFixed(2)}</span>
        )}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex items-start gap-2 text-mute">
          <div className="w-2 h-2 rounded-full border border-cobalt mt-1.5 flex-shrink-0" />
          <span>{ride.originAddress}</span>
        </div>
        <div className="w-0.5 h-3 ml-1 bg-line" />
        <div className="flex items-start gap-2 text-mute">
          <MapPin className="w-3.5 h-3.5 text-coral mt-0.5 flex-shrink-0" />
          <span>{ride.destinationAddress}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onReject}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'color-mix(in srgb, var(--coral) 12%, transparent)', color: 'var(--coral)' }}
        >
          <X className="w-4 h-4 inline mr-1" />
          Recusar
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--cobalt)' }}
        >
          <Check className="w-4 h-4 inline mr-1" />
          Aceitar
        </button>
      </div>
    </div>
  );
}

export function DriverDashboardPage() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [pos, setPos] = useState<[number, number]>(PALMITAL_CENTER);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [toggling, setToggling] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const { connect, disconnect, emitLocation, pendingRides, setPendingRides } = useDriverSocket();

  useEffect(() => {
    ridesApi.getDriverProfile()
      .then((r) => {
        setDriver(r.data);
        setOnline(r.data.status === 'ONLINE');
        if (r.data.lat && r.data.lng) setPos([r.data.lat, r.data.lng]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const goOnline = async () => {
    setToggling(true);
    try {
      await ridesApi.setDriverStatus('ONLINE');
      setOnline(true);
      connect();
      const id = navigator.geolocation.watchPosition((p) => {
        const latlng: [number, number] = [p.coords.latitude, p.coords.longitude];
        setPos(latlng);
        emitLocation(latlng[0], latlng[1]);
      });
      setWatchId(id);
    } finally {
      setToggling(false);
    }
  };

  const goOffline = async () => {
    setToggling(true);
    try {
      await ridesApi.setDriverStatus('OFFLINE');
      setOnline(false);
      disconnect();
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    } finally {
      setToggling(false);
    }
  };

  const acceptRide = async (ride: Ride) => {
    setAccepting(ride.id);
    try {
      await ridesApi.acceptRide(ride.id);
      setActiveRide(ride);
      setPendingRides([]);
    } finally {
      setAccepting(null);
    }
  };

  const rejectRide = (rideId: string) => {
    setPendingRides((p) => p.filter((r) => r.id !== rideId));
  };

  const advanceActiveRide = async () => {
    if (!activeRide) return;
    const transitions: Record<string, string> = {
      ACCEPTED: 'DRIVER_ARRIVED',
      DRIVER_ARRIVED: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
    };
    const next = transitions[activeRide.status];
    if (!next) return;
    await ridesApi.updateRideStatus(activeRide.id, next);
    setActiveRide((r) => r ? { ...r, status: next } : r);
    if (next === 'COMPLETED') setActiveRide(null);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-8 glass rounded-2xl w-1/2" />
        <div className="h-64 glass rounded-3xl" />
        <div className="h-32 glass rounded-3xl" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="glass rounded-3xl p-8 text-center space-y-4">
          <Car className="w-12 h-12 text-mute mx-auto opacity-40" />
          <p className="font-semibold text-ink">Você não é motorista ainda</p>
          <Link to="/rides/driver/register" className="btn-ink inline-flex">Cadastrar como motorista</Link>
        </div>
      </div>
    );
  }

  const NEXT_LABEL: Record<string, string> = {
    ACCEPTED: 'Cheguei ao passageiro',
    DRIVER_ARRIVED: 'Iniciar viagem',
    IN_PROGRESS: 'Finalizar corrida',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto">
      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer center={pos} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={pos} />
          {activeRide && (
            <>
              <Marker position={[activeRide.originLat, activeRide.originLng]} />
              <Marker position={[activeRide.destinationLat, activeRide.destinationLng]} />
            </>
          )}
        </MapContainer>

        <Link
          to="/rides"
          className="absolute top-3 left-3 z-[1000] w-9 h-9 glass rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-ink" />
        </Link>

        <div className="absolute top-3 right-3 z-[1000]">
          <div className={`chip text-xs font-medium flex items-center gap-1.5 ${online ? 'text-mint' : 'text-mute'}`}
            style={{ background: online ? 'color-mix(in srgb, var(--mint) 20%, var(--surface))' : 'var(--surface)' }}
          >
            <div className={`w-2 h-2 rounded-full ${online ? 'bg-mint animate-pulse' : 'bg-mute'}`} />
            {online ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      <div className="px-4 py-4 space-y-3">
        {/* Driver info + toggle */}
        <div className="glass rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cobalt/15 flex items-center justify-center text-xl flex-shrink-0">🚗</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ink text-sm">{driver.vehicleColor} {driver.vehicleModel}</p>
            <p className="text-xs text-mute">{driver.vehiclePlate}</p>
          </div>
          <button
            onClick={online ? goOffline : goOnline}
            disabled={toggling}
            className="flex items-center gap-2 font-medium text-sm transition-colors disabled:opacity-50"
            style={{ color: online ? 'var(--mint)' : 'var(--cobalt)' }}
          >
            {online ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
            {online ? 'Online' : 'Offline'}
          </button>
        </div>

        {/* Pending rides */}
        {pendingRides.map((r) => (
          <PendingRideCard
            key={r.id}
            ride={r}
            onAccept={() => acceptRide(r)}
            onReject={() => rejectRide(r.id)}
          />
        ))}

        {/* Active ride controls */}
        {activeRide && NEXT_LABEL[activeRide.status] && (
          <div className="halo halo-cobalt glass rounded-2xl p-4 space-y-3">
            <div className="text-sm space-y-1">
              <p className="font-semibold text-ink">Corrida ativa</p>
              <p className="text-mute flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-coral mt-0.5 flex-shrink-0" />
                {activeRide.destinationAddress}
              </p>
            </div>
            <button
              onClick={advanceActiveRide}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'var(--cobalt)' }}
            >
              {NEXT_LABEL[activeRide.status]}
            </button>
          </div>
        )}

        {online && pendingRides.length === 0 && !activeRide && (
          <div className="glass rounded-2xl p-4 text-center">
            <Navigation className="w-6 h-6 text-cobalt mx-auto mb-1 animate-bounce" />
            <p className="text-sm text-mute">Aguardando corridas próximas...</p>
          </div>
        )}
      </div>
    </div>
  );
}
