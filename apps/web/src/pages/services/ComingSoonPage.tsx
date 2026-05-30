import { ArrowLeft, Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

type AccentTone = 'coral' | 'citrus' | 'cobalt' | 'magenta' | 'mint' | 'amber';

interface ComingSoonPageProps {
  title: string;
  subtitle: string;
  accent: AccentTone;
  description: string;
  backTo?: string;
  backLabel?: string;
  features?: string[];
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

const dotMap: Record<AccentTone, string> = {
  coral: 'bg-coral',
  citrus: 'bg-citrus',
  cobalt: 'bg-cobalt',
  magenta: 'bg-magenta',
  mint: 'bg-mint',
  amber: 'bg-amber',
};

export function ComingSoonPage({
  title,
  subtitle,
  accent,
  description,
  backTo = '/services',
  backLabel = 'Voltar aos serviços',
  features = [],
}: ComingSoonPageProps) {
  return (
    <div className="space-y-5">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-mute transition-colors hover:text-ink"
      >
        <ArrowLeft size={12} strokeWidth={2.5} />
        {backLabel}
      </Link>

      <div className="glass shape-signature-lg halo halo-coral relative overflow-hidden p-6 lg:p-10">
        <div className={`chip chip-${accent}`}>
          <Construction size={11} strokeWidth={2.5} />
          EM CONSTRUÇÃO
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div
            className={`halo ${accentHalo[accent]} flex h-16 w-16 items-center justify-center rounded-2xl ${accentBg[accent]} text-white`}
          >
            <Construction size={28} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink lg:text-4xl">
              {title}
            </h1>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mute">
              {subtitle}
            </p>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink lg:text-lg">{description}</p>

        {features.length > 0 && (
          <div className="mt-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-mute">
              O que vem por aí
            </p>
            <ul className="mt-3 space-y-2">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-ink"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotMap[accent]}`} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
