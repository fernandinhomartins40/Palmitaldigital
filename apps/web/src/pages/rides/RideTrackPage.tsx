import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Car, MapPin, Phone, Star, QrCode, X, CheckCircle } from 'lucide-react';
import { useRide } from '../../hooks/useRides';
import { ridesApi } from '../../services/ridesApi';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DRIVER_ICON = new L.DivIcon({
  html: `<div style="background:var(--cobalt);width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">🚗</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: '',
});

const STATUS_STEPS = [
  { key: 'REQUESTED', label: 'Procurando motorista', emoji: '🔍' },
  { key: 'ACCEPTED', label: 'Motorista a caminho', emoji: '🚗' },
  { key: 'DRIVER_ARRIVED', label: 'Motorista chegou', emoji: '📍' },
  { key: 'IN_PROGRESS', label: 'Em viagem', emoji: '🛣️' },
  { key: 'COMPLETED', label: 'Chegamos!', emoji: '🏁' },
];

function RatingModal({ rideId, onDone }: { rideId: string; onDone: () => void }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await ridesApi.rateRide(rideId, stars, comment);
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl p-6 w-full max-w-sm space-y-4">
        <h3 className="font-bold text-xl text-ink text-center">Como foi a corrida?</h3>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setStars(n)}>
              <Star
                className="w-8 h-8 transition-all"
                style={{
                  fill: n <= stars ? 'var(--amber)' : 'transparent',
                  color: n <= stars ? 'var(--amber)' : 'var(--line)',
                }}
              />
            </button>
          ))}
        </div>
        <textarea
          className="w-full glass rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-mute outline-none border border-line resize-none"
          rows={3}
          placeholder="Comentário opcional..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full btn-ink py-3 font-semibold"
          style={{ background: 'var(--cobalt)' }}
        >
          {submitting ? 'Enviando...' : 'Avaliar'}
        </button>
        <button onClick={onDone} className="w-full text-sm text-mute hover:text-ink transition-colors">
          Pular
        </button>
      </div>
    </div>
  );
}

export function RideTrackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ride, loading, driverPos, reload } = useRide(id!);
  const [showRating, setShowRating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cancel = async () => {
    setCancelling(true);
    try {
      await ridesApi.cancelRide(id!);
      reload();
    } finally {
      setCancelling(false);
    }
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

  if (!ride) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="glass rounded-3xl p-12 text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="font-semibold text-ink">Corrida não encontrada</p>
          <Link to="/rides" className="btn-ink mt-4 inline-flex">Voltar</Link>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === ride.status);
  const isCompleted = ride.status === 'COMPLETED';
  const isCancelled = ride.status === 'CANCELLED';
  const canCancel = ['REQUESTED', 'ACCEPTED'].includes(ride.status);

  const mapCenter: [number, number] = driverPos
    ? [driverPos.lat, driverPos.lng]
    : [ride.originLat, ride.originLng];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto">
      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer center={mapCenter} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[ride.originLat, ride.originLng]}>
            <Popup>Origem: {ride.originAddress}</Popup>
          </Marker>
          <Marker position={[ride.destinationLat, ride.destinationLng]}>
            <Popup>Destino: {ride.destinationAddress}</Popup>
          </Marker>
          {driverPos && (
            <Marker position={[driverPos.lat, driverPos.lng]} icon={DRIVER_ICON}>
              <Popup>Motorista</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Back */}
        <Link
          to="/rides"
          className="absolute top-3 left-3 z-[1000] w-9 h-9 glass rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-ink" />
        </Link>
      </div>

      {/* Bottom panel */}
      <div className="px-4 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
        {/* Status timeline */}
        {!isCancelled && (
          <div className="glass rounded-3xl p-4 space-y-3">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                    style={{
                      background: done
                        ? active
                          ? 'var(--cobalt)'
                          : 'color-mix(in srgb, var(--mint) 20%, transparent)'
                        : 'var(--subtle)',
                    }}
                  >
                    {done ? (active ? step.emoji : '✓') : <span className="w-2 h-2 rounded-full bg-line" />}
                  </div>
                  <span
                    className={`text-sm ${done ? 'text-ink' : 'text-mute'} ${active ? 'font-semibold' : ''}`}
                  >
                    {step.label}
                  </span>
                  {active && (
                    <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--cobalt)' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isCancelled && (
          <div className="glass rounded-2xl p-4 text-center">
            <X className="w-8 h-8 text-coral mx-auto mb-2" />
            <p className="font-semibold text-ink">Corrida cancelada</p>
          </div>
        )}

        {/* Driver info */}
        {ride.driver && (
          <div className="glass rounded-2xl p-3 flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'color-mix(in srgb, var(--cobalt) 15%, transparent)' }}
            >
              🚗
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink text-sm">{ride.driver.user.profile.displayName}</p>
              <p className="text-xs text-mute">
                {ride.driver.vehicleColor} {ride.driver.vehicleModel} · {ride.driver.vehiclePlate}
              </p>
            </div>
          </div>
        )}

        {/* PIX on complete */}
        {isCompleted && ride.pixQrCode && (
          <div className="glass rounded-2xl p-4 space-y-2 text-center">
            <div className="flex items-center gap-2 justify-center font-semibold text-ink">
              <QrCode className="w-4 h-4 text-cobalt" />
              Pague com PIX
            </div>
            <div className="glass-strong rounded-xl p-2 font-mono text-xs text-ink break-all select-all">
              {ride.pixQrCode}
            </div>
            <p className="text-xs text-mute">
              Total: <strong className="text-ink">R$ {ride.finalPrice?.toFixed(2)}</strong>
            </p>
          </div>
        )}

        {/* Rating trigger */}
        {isCompleted && !ride.rating && (
          <button
            onClick={() => setShowRating(true)}
            className="w-full btn-ink py-3 font-semibold flex items-center justify-center gap-2"
            style={{ background: 'var(--cobalt)' }}
          >
            <Star className="w-5 h-5" />
            Avaliar corrida
          </button>
        )}

        {isCompleted && ride.rating && (
          <div className="glass rounded-2xl p-3 flex items-center gap-2 justify-center">
            <CheckCircle className="w-4 h-4 text-mint" />
            <span className="text-sm text-ink">Avaliação enviada: {ride.rating}★</span>
          </div>
        )}

        {canCancel && (
          <button
            onClick={cancel}
            disabled={cancelling}
            className="w-full py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: 'color-mix(in srgb, var(--coral) 10%, transparent)', color: 'var(--coral)' }}
          >
            {cancelling ? 'Cancelando...' : 'Cancelar corrida'}
          </button>
        )}
      </div>

      {showRating && (
        <RatingModal rideId={id!} onDone={() => { setShowRating(false); reload(); }} />
      )}
    </div>
  );
}
