import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  Car,
  MessageCircle,
  Newspaper,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

type AccentTone = 'coral' | 'citrus' | 'cobalt' | 'magenta' | 'mint' | 'amber';

interface ServiceCard {
  to: string;
  title: string;
  description: string;
  icon: any;
  accent: AccentTone;
  badge?: string;
}

const accentBg: Record<AccentTone, string> = {
  coral: 'bg-coral',
  citrus: 'bg-citrus text-ink',
  cobalt: 'bg-cobalt',
  magenta: 'bg-magenta',
  mint: 'bg-mint text-ink',
  amber: 'bg-amber text-ink',
};

const accentHalo: Record<AccentTone, string> = {
  coral: 'halo-coral',
  citrus: 'halo-citrus',
  cobalt: 'halo-cobalt',
  magenta: 'halo-magenta',
  mint: 'halo-mint',
  amber: 'halo-amber',
};

const services: ServiceCard[] = [
  {
    to: '/rides',
    title: 'Mobilidade',
    description: 'Peça uma corrida ou dirija e ganhe rodando em Palmital.',
    icon: Car,
    accent: 'cobalt',
    badge: 'NOVO',
  },
  {
    to: '/delivery',
    title: 'Delivery',
    description: 'Restaurantes locais entregando na sua casa.',
    icon: UtensilsCrossed,
    accent: 'coral',
    badge: 'NOVO',
  },
  {
    to: '/news',
    title: 'Notícias',
    description: 'Jornalismo e blog independente de Palmital.',
    icon: Newspaper,
    accent: 'magenta',
    badge: 'NOVO',
  },
  {
    to: '/classifieds',
    title: 'Mercado',
    description: 'Compre e venda direto com vizinhos.',
    icon: ShoppingBag,
    accent: 'citrus',
  },
  {
    to: '/companies',
    title: 'Empresas',
    description: 'Diretório de negócios e profissionais da cidade.',
    icon: Building2,
    accent: 'mint',
  },
  {
    to: '/chat',
    title: 'Conversas',
    description: 'Mensagens diretas com qualquer pessoa.',
    icon: MessageCircle,
    accent: 'amber',
  },
];

export function ServicesHubPage() {
  return (
    <div className="space-y-6">
      <section className="glass shape-signature-lg halo halo-coral relative overflow-hidden p-6 lg:p-8">
        <div className="chip chip-coral">
          <Sparkles size={11} strokeWidth={2.5} />
          SUPER-APP
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-ink lg:text-5xl">
          Tudo de Palmital,<br />num só app.
        </h1>
        <p className="mt-3 max-w-xl text-base text-mute lg:text-lg">
          Mobilidade, comida, notícias, mercado e empresas. Conectados pela mesma identidade municipal.
        </p>
      </section>

      <section>
        <p className="mb-3 px-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-mute">
          Serviços disponíveis
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ to, title, description, icon: Icon, accent, badge }) => (
            <Link
              key={to}
              to={to}
              className="glass shape-signature group relative overflow-hidden p-5 transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`halo ${accentHalo[accent]} flex h-14 w-14 items-center justify-center rounded-2xl ${accentBg[accent]}`}
                >
                  <Icon
                    size={26}
                    strokeWidth={2.2}
                    className={
                      accent === 'citrus' || accent === 'mint' || accent === 'amber'
                        ? 'text-ink'
                        : 'text-white'
                    }
                  />
                </div>

                {badge && (
                  <span className={`chip chip-${accent}`}>{badge}</span>
                )}
              </div>

              <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink">
                {title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-mute">{description}</p>

              <div className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink transition-transform group-hover:translate-x-1">
                Abrir
                <ArrowUpRight size={11} strokeWidth={2.5} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="glass shape-signature p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-mute">
              É prestador?
            </p>
            <p className="mt-1 font-display text-base font-bold text-ink">
              Cadastre seu serviço e atenda Palmital.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/rides/driver/register"
              className="chip chip-cobalt hover:scale-105 transition-transform"
            >
              Motorista
            </Link>
            <Link
              to="/delivery/manage"
              className="chip chip-coral hover:scale-105 transition-transform"
            >
              Restaurante
            </Link>
            <Link
              to="/news/apply"
              className="chip chip-magenta hover:scale-105 transition-transform"
            >
              Jornalista
            </Link>
            <Link
              to="/companies/manage"
              className="chip chip-mint hover:scale-105 transition-transform"
            >
              Empresa
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
