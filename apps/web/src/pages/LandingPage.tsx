import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  MessageCircle,
  Rss,
  ChevronRight,
  MapPin,
  Star,
  Bell,
  ShoppingBag,
} from 'lucide-react';

const features = [
  {
    icon: Rss,
    title: 'Feed Comunitário',
    desc: 'Acompanhe as novidades, eventos e histórias da sua cidade em um só lugar.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Store,
    title: 'Classificados Locais',
    desc: 'Compre e venda produtos e serviços com segurança dentro da sua comunidade.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: MessageCircle,
    title: 'Chat em Tempo Real',
    desc: 'Converse com vizinhos, empresas e amigos de forma rápida e segura.',
    color: 'from-violet-500 to-violet-600',
  },
  {
    icon: Users,
    title: 'Empresas Locais',
    desc: 'Descubra e apoie os negócios da sua região. Crie seu perfil profissional.',
    color: 'from-orange-500 to-orange-600',
  },
];

const stats = [
  { value: '10k+', label: 'Moradores conectados' },
  { value: '500+', label: 'Empresas cadastradas' },
  { value: '25k+', label: 'Publicações mensais' },
  { value: '4.9★', label: 'Avaliação dos usuários' },
];

const testimonials = [
  {
    name: 'Ana Paula S.',
    role: 'Comerciante local',
    text: 'Com o Palmital Digital triplicamos os pedidos do nosso restaurante sem precisar de delivery externo!',
    avatar: 'AP',
  },
  {
    name: 'Carlos M.',
    role: 'Morador do bairro',
    text: 'Consegui vender meu carro em 2 dias pelos classificados. A plataforma é muito fácil de usar.',
    avatar: 'CM',
  },
  {
    name: 'Maria L.',
    role: 'Prestadora de serviços',
    text: 'Hoje tenho clientes que nunca saberiam que eu existia. O alcance local é incrível!',
    avatar: 'ML',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-blue-700 tracking-tight">Palmital Digital</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="pt-14 min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full w-fit">
              <Bell size={12} />
              Novidades todo dia na sua cidade
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              A rede social da{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                sua comunidade
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Conecte-se com moradores, descubra empresas locais, compre e venda nos classificados —
              tudo em uma plataforma feita especialmente para Palmital e região.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                Criar conta grátis
                <ChevronRight size={18} />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-6 py-3.5 rounded-xl text-base transition-all border border-gray-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
              >
                Já tenho conta
              </Link>
            </div>
            {/* Stats strip */}
            <div className="flex flex-wrap gap-6 pt-2">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-extrabold text-blue-600">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: App preview mockup */}
          <div className="hidden md:flex justify-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[280px] h-[520px] bg-gray-900 rounded-[3rem] shadow-2xl p-3 ring-4 ring-gray-800">
                <div className="h-full bg-gray-50 rounded-[2.4rem] overflow-hidden flex flex-col">
                  {/* Fake app bar */}
                  <div className="bg-white px-4 py-2.5 flex items-center justify-between border-b border-gray-100">
                    <span className="font-bold text-blue-600 text-sm">Palmital Digital</span>
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bell size={12} className="text-blue-600" />
                    </div>
                  </div>
                  {/* Fake posts */}
                  <div className="flex-1 overflow-hidden p-3 space-y-3">
                    {[
                      { user: 'Prefeitura', time: '2min', txt: '🎉 Festa junina confirmada na praça central este sábado!' },
                      { user: 'João M.', time: '15min', txt: 'Vendo Honda Fit 2019, único dono. Valor: R$52.000' },
                      { user: 'Padaria Central', time: '1h', txt: 'Pão de queijo fresquinho todos os dias a partir das 6h!' },
                    ].map((item) => (
                      <div key={item.user} className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[8px] text-white font-bold">
                            {item.user[0]}
                          </div>
                          <span className="text-[11px] font-semibold text-gray-800">{item.user}</span>
                          <span className="text-[10px] text-gray-400 ml-auto">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-gray-700 leading-relaxed">{item.txt}</p>
                      </div>
                    ))}
                  </div>
                  {/* Fake bottom nav */}
                  <div className="bg-white border-t border-gray-100 flex justify-around py-2">
                    {[Rss, ShoppingBag, MessageCircle, Users].map((Icon, i) => (
                      <div key={i} className={`p-2 rounded-xl ${i === 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                        <Icon size={18} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating cards */}
              <div className="absolute -left-12 top-24 bg-white shadow-xl rounded-2xl p-3 flex items-center gap-2 w-44 animate-bounce-slow">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Store size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-800">Novo classificado</p>
                  <p className="text-[10px] text-gray-500">Bike aro 26 — R$350</p>
                </div>
              </div>
              <div className="absolute -right-10 bottom-32 bg-white shadow-xl rounded-2xl p-3 flex items-center gap-2 w-40">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Star size={16} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-800">4.9 ★★★★★</p>
                  <p className="text-[10px] text-gray-500">Avaliação média</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Tudo que sua cidade precisa em um só app
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Uma plataforma completa desenvolvida para fortalecer as conexões e a economia local.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-lg hover:-translate-y-1 transition-all bg-white"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-sm`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Quem usa, aprova
            </h2>
            <p className="text-gray-500">Histórias reais de quem transformou sua vida na plataforma.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, avatar }) => (
              <div key={name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-start gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Faça parte da comunidade digital de Palmital
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            É gratuito, leva menos de 1 minuto e conecta você com toda a cidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl text-base hover:bg-blue-50 transition-all shadow-lg hover:-translate-y-0.5"
            >
              Criar conta gratuita
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-blue-500/30 hover:bg-blue-500/50 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all border border-white/20"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <MapPin size={12} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">Palmital Digital</span>
          </div>
          <p className="text-xs text-center">
            © {new Date().getFullYear()} Palmital Digital. Conectando a cidade.
          </p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
