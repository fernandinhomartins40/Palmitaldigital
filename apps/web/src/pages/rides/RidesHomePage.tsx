import { Link } from 'react-router-dom';
import { Car, MapPin, Clock, Star, ChevronRight, Plus } from 'lucide-react';
import { useMyRides } from '../../hooks/useRides';
import { useAuthStore } from '../../store/authStore';
import type { Ride } from '../../services/ridesApi';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: 'Procurando motorista', color: 'var(--amber)' },
  ACCEPTED: { label: 'Motorista a caminho', color: 'var(--cobalt)' },
  DRIVER_ARRIVED: { label: 'Motorista chegou', color: 'var(--cobalt)' },
  IN_PROGRESS: { label: 'Em viagem', color: 'var(--mint)' },
  COMPLETED: { label: 'Concluída', color: 'var(--mint)' },
  CANCELLED: { label: 'Cancelada', color: 'var(--coral)' },
};

function RideCard({ ride }: { ride: Ride }) {
  const s = STATUS_LABEL[ride.status] ?? { label: ride.status, color: 'var(--mute)' };
  const active = !['COMPLETED', 'CANCELLED'].includes(ride.status);

  return (
    <Link
      to={active ? `/rides/track/${ride.id}` : '#'}
      className="glass rounded-2xl p-4 flex gap-3 hover:shadow transition-all"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `color-mix(in srgb, ${s.color} 15%, transparent)` }}
      >
        <Car className="w-5 h-5" style={{ color: s.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="chip text-xs" style={{ background: `color-mix(in srgb, ${s.color} 15%, transparent)`, color: s.color }}>
            {s.label}
          </span>
        </div>
        <p className="text-sm text-ink font-medium truncate flex items-center gap-1">
          <MapPin className="w-3 h-3 text-mute flex-shrink-0" />
          {ride.destinationAddress}
        </p>
        <p className="text-xs text-mute flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {new Date(ride.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
        {ride.rating && (
          <p className="text-xs text-mute flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-amber text-amber" />
            {ride.rating}
          </p>
        )}
      </div>
      {ride.finalPrice && (
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-ink text-sm">R$ {ride.finalPrice.toFixed(2)}</p>
        </div>
      )}
      {active && <ChevronRight className="w-4 h-4 text-mute flex-shrink-0 self-center" />}
    </Link>
  );
}

export function RidesHomePage() {
  const { rides, loading } = useMyRides();
  const user = useAuthStore((s) => s.user);
  const isDriver = user?.role === 'DRIVER' || user?.role === 'ADMIN';

  const activeRide = rides.find((r) => !['COMPLETED', 'CANCELLED'].includes(r.status));
  const pastRides = rides.filter((r) => ['COMPLETED', 'CANCELLED'].includes(r.status));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="halo halo-cobalt glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Mobilidade</h1>
            <p className="text-mute text-sm">Corridas em Palmital</p>
          </div>
          {isDriver && (
            <Link to="/rides/driver" className="btn-ink flex items-center gap-2 text-sm">
              <Car className="w-4 h-4" />
              Painel motorista
            </Link>
          )}
        </div>

        {/* CTA */}
        <Link
          to="/rides/request"
          className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:scale-[1.01]"
          style={{ background: 'var(--cobalt)', color: '#fff' }}
        >
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Para onde vamos?</p>
            <p className="text-sm opacity-80">Toque para pedir uma corrida</p>
          </div>
          <ChevronRight className="w-5 h-5" />
        </Link>

        {!isDriver && (
          <Link
            to="/rides/driver/register"
            className="flex items-center gap-2 text-sm justify-center btn-glass"
            style={{ color: 'var(--cobalt)' }}
          >
            <Plus className="w-4 h-4" />
            Quero ser motorista
          </Link>
        )}
      </div>

      {/* Active ride */}
      {activeRide && (
        <div className="space-y-2">
          <p className="font-semibold text-ink text-sm">Corrida ativa</p>
          <RideCard ride={activeRide} />
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <p className="font-semibold text-ink text-sm">Histórico</p>

        {loading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && pastRides.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center">
            <Car className="w-10 h-10 text-mute mx-auto mb-2 opacity-40" />
            <p className="text-mute text-sm">Nenhuma corrida ainda</p>
            <Link to="/rides/request" className="btn-ink mt-3 inline-flex text-sm">Pedir corrida</Link>
          </div>
        )}

        {pastRides.map((r) => (
          <RideCard key={r.id} ride={r} />
        ))}
      </div>
    </div>
  );
}
