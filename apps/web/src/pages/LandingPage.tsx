import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  ChevronRight,
  MessageCircle,
  Rss,
  Sparkles,
  Star,
  Store,
} from 'lucide-react';

type AccentTone = 'coral' | 'citrus' | 'cobalt' | 'magenta' | 'mint';

const features: Array<{ icon: any; title: string; desc: string; accent: AccentTone }> = [
  { icon: Rss, title: 'Feed Comunitário', desc: 'Acompanhe novidades, eventos e histórias da sua cidade.', accent: 'coral' },
  { icon: Store, title: 'Mercado Local', desc: 'Compre e venda com vizinhos. Pratos, móveis, serviços.', accent: 'citrus' },
  { icon: Building2, title: 'Empresas', desc: 'Descubra negócios da sua região. Crie um perfil profissional.', accent: 'cobalt' },
  { icon: MessageCircle, title: 'Conversas', desc: 'Mensagens diretas com qualquer pessoa da plataforma.', accent: 'magenta' },
];

const stats = [
  { value: '10k+', label: 'Moradores', accent: 'bg-coral' },
  { value: '500+', label: 'Empresas', accent: 'bg-cobalt' },
  { value: '25k+', label: 'Posts/mês', accent: 'bg-citrus' },
  { value: '4.9', label: 'Avaliação', accent: 'bg-magenta' },
];

const testimonials: Array<{ name: string; role: string; text: string; accent: AccentTone }> = [
  {
    name: 'Ana Paula S.',
    role: 'Restaurante local',
    text: 'Triplicamos os pedidos do restaurante sem precisar de delivery externo.',
    accent: 'coral',
  },
  {
    name: 'Carlos M.',
    role: 'Morador',
    text: 'Vendi meu carro em 2 dias pelo mercado. Plataforma fácil de usar.',
    accent: 'citrus',
  },
  {
    name: 'Maria L.',
    role: 'Prestadora de serviços',
    text: 'Hoje tenho clientes que nunca saberiam que eu existia. Alcance local incrível.',
    accent: 'magenta',
  },
];

const accentBg: Record<string, string> = {
  coral: 'bg-coral',
  citrus: 'bg-citrus text-ink',
  cobalt: 'bg-cobalt',
  magenta: 'bg-magenta',
  mint: 'bg-mint text-ink',
};

const accentHalo: Record<string, string> = {
  coral: 'halo-coral',
  citrus: 'halo-citrus',
  cobalt: 'halo-cobalt',
  magenta: 'halo-magenta',
  mint: 'halo-mint',
};

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-ink">
      {/* Halos de fundo */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[36rem] w-[36rem] rounded-full opacity-25 blur-[150px]" style={{ background: '#FF5B49' }} />
        <div className="absolute right-[-12rem] top-[20%] h-[32rem] w-[32rem] rounded-full opacity-20 blur-[140px]" style={{ background: '#3D5AFE' }} />
        <div className="absolute -bottom-32 left-[25%] h-[30rem] w-[30rem] rounded-full opacity-20 blur-[140px]" style={{ background: '#5EEAD4' }} />
        <div className="absolute right-[15%] bottom-[20%] h-[24rem] w-[24rem] rounded-full opacity-15 blur-[120px]" style={{ background: '#E94FCB' }} />
      </div>

      {/* HEADER flutuante */}
      <header className="fixed inset-x-3 top-3 z-50 lg:inset-x-6 lg:top-4">
        <div className="glass shape-signature mx-auto flex h-14 max-w-6xl items-center justify-between px-3 lg:h-16 lg:px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="halo halo-coral flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-surface">
              <span className="font-display text-base font-black">P</span>
            </div>
            <span className="font-display text-base font-bold tracking-tight text-ink">
              Palmital
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-3 py-1.5 text-sm font-bold text-ink transition-colors hover:bg-ink/5 dark:hover:bg-white/5"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="btn-ink !py-2 !text-sm"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="px-4 pb-16 pt-32 lg:px-6 lg:pt-40">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="chip chip-coral">
                <Sparkles size={11} strokeWidth={2.5} />
                NOVO EM PALMITAL
              </div>
              <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink lg:text-7xl">
                A rede da{' '}
                <span className="relative inline-block">
                  <span className="halo halo-coral relative z-10">sua cidade</span>
                  <span className="absolute -bottom-1 left-0 h-3 w-full bg-coral/40" />
                </span>
                .
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute lg:text-xl">
                Feed, mercado, empresas e mensagens. Tudo em um só lugar, sem azul-genérico e sem
                promessa vazia.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="halo halo-coral group flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-4 font-bold text-surface transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Criar conta grátis
                  <ArrowRight size={18} strokeWidth={2.4} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/login"
                  className="btn-glass !py-4"
                >
                  Já tenho conta
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="relative">
                    <span className={`absolute -top-1 left-0 h-1.5 w-1.5 rounded-full ${s.accent}`} />
                    <p className="font-display text-2xl font-bold text-ink lg:text-3xl">{s.value}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mute">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div
                  className="halo halo-coral relative h-[560px] w-[300px] bg-ink p-3 shadow-2xl"
                  style={{ borderRadius: '48px 48px 24px 48px' }}
                >
                  <div
                    className="flex h-full flex-col overflow-hidden bg-canvas"
                    style={{ borderRadius: '36px 36px 14px 36px' }}
                  >
                    <div className="glass flex items-center justify-between px-4 py-3">
                      <span className="font-display text-sm font-bold text-ink">Feed</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-coral text-white">
                        <MessageCircle size={12} />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-hidden p-3">
                      {[
                        { name: 'Prefeitura', time: '2min', txt: 'Festa junina confirmada sábado!', accent: 'coral' },
                        { name: 'João M.', time: '15min', txt: 'Honda Fit 2019 — R$52.000', accent: 'citrus' },
                        { name: 'Padaria Central', time: '1h', txt: 'Pão de queijo fresquinho desde as 6h', accent: 'cobalt' },
                      ].map((item) => (
                        <div key={item.name} className="glass p-3" style={{ borderRadius: '14px 14px 4px 14px' }}>
                          <div className="mb-1.5 flex items-center gap-2">
                            <div className={`flex h-5 w-5 items-center justify-center rounded-md ${accentBg[item.accent]} text-[8px] font-bold`}>
                              {item.name[0]}
                            </div>
                            <span className="text-[11px] font-bold text-ink">{item.name}</span>
                            <span className="ml-auto font-mono text-[9px] uppercase text-mute">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-[11px] leading-tight text-ink">{item.txt}</p>
                        </div>
                      ))}
                    </div>
                    <div className="glass flex justify-around border-t border-line py-2">
                      {[Rss, Store, MessageCircle, Building2].map((Icon, i) => (
                        <div key={i} className={`p-1.5 ${i === 0 ? 'text-coral' : 'text-mute'}`}>
                          <Icon size={16} strokeWidth={i === 0 ? 2.4 : 1.5} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass absolute -left-10 top-32 animate-bounce-slow p-3" style={{ borderRadius: '16px 16px 4px 16px' }}>
                  <div className="flex items-center gap-2">
                    <div className="halo halo-citrus flex h-8 w-8 items-center justify-center rounded-lg bg-citrus text-ink">
                      <Store size={15} />
                    </div>
                    <div>
                      <p className="font-display text-[11px] font-bold text-ink">Novo anúncio</p>
                      <p className="font-mono text-[9px] uppercase text-mute">Bike — R$350</p>
                    </div>
                  </div>
                </div>

                <div className="glass absolute -right-10 bottom-32 p-3" style={{ borderRadius: '16px 16px 4px 16px' }}>
                  <div className="flex items-center gap-2">
                    <div className="halo halo-magenta flex h-8 w-8 items-center justify-center rounded-lg bg-magenta text-white">
                      <Star size={15} />
                    </div>
                    <div>
                      <p className="font-display text-[11px] font-bold text-ink">4.9 ★</p>
                      <p className="font-mono text-[9px] uppercase text-mute">Avaliação</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 py-20 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-coral">
              O que tem aqui
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold leading-tight tracking-tight text-ink lg:text-5xl">
              Tudo que sua cidade precisa,<br />em um só lugar.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc, accent }) => (
              <div
                key={title}
                className="glass shape-signature group p-5 transition-all hover:-translate-y-1"
              >
                <div className={`halo ${accentHalo[accent]} flex h-12 w-12 items-center justify-center rounded-xl ${accentBg[accent]}`}>
                  <Icon size={22} strokeWidth={2.2} className={accent === 'citrus' || accent === 'mint' ? 'text-ink' : 'text-white'} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mute">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-4 py-20 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-magenta">
              Histórias reais
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold leading-tight tracking-tight text-ink lg:text-5xl">
              Quem usa, aprova.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {testimonials.map(({ name, role, text, accent }) => (
              <div key={name} className="glass shape-signature p-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} className="fill-amber text-amber" />
                  ))}
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-ink">"{text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`halo ${accentHalo[accent]} flex h-10 w-10 items-center justify-center rounded-xl ${accentBg[accent]} font-display text-sm font-bold text-white`}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-ink">{name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-mute">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 py-20 lg:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="glass-strong shape-signature-lg halo halo-coral relative overflow-hidden p-8 text-center lg:p-14">
            <div className="chip chip-coral mx-auto">
              <Sparkles size={11} strokeWidth={2.5} />
              GRÁTIS PARA SEMPRE
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-ink lg:text-5xl">
              Bem-vindo a Palmital<br />Digital.
            </h2>
            <p className="mt-4 text-lg text-mute">
              É gratuito, leva menos de 1 minuto e conecta você com toda a cidade.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/register"
                className="halo halo-coral inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-8 py-4 font-bold text-surface transition-all hover:-translate-y-0.5"
              >
                Criar conta
                <ChevronRight size={18} strokeWidth={2.4} />
              </Link>
              <Link
                to="/login"
                className="btn-glass !py-4"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 py-10 lg:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="halo halo-coral flex h-6 w-6 items-center justify-center rounded-md bg-ink text-surface">
              <span className="font-display text-xs font-black">P</span>
            </div>
            <span className="font-display text-sm font-bold text-ink">Palmital Digital</span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
            © {new Date().getFullYear()} — Conectando a cidade
          </p>
          <div className="flex gap-4 font-mono text-[10px] uppercase tracking-wider text-mute">
            <a href="#" className="hover:text-ink">Privacidade</a>
            <a href="#" className="hover:text-ink">Termos</a>
            <a href="#" className="hover:text-ink">Suporte</a>
            <a
              href="http://localhost:3010"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink opacity-40 hover:opacity-100 transition-opacity"
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
