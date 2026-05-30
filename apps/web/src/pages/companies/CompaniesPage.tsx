import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Avatar, Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { BadgeCheck, Building2, MapPin, PlusCircle, Search, Settings2 } from 'lucide-react';
import { useState } from 'react';

export function CompaniesPage() {
  const [city, setCity] = useState('');
  const currentUser = useAuthStore((s) => s.user);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies', city],
    queryFn: async () => {
      const params: any = {};
      if (city) params.city = city;
      const { data } = await api.get('/companies', { params });
      return data as any[];
    },
  });

  const { data: myCompany } = useQuery({
    queryKey: ['my-company'],
    retry: false,
    enabled: !!currentUser,
    queryFn: async () => {
      try {
        const { data } = await api.get('/companies/me');
        return data as any;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
  });

  return (
    <div className="space-y-5">
      {/* HERO Empresas */}
      <section className="glass shape-signature-lg halo halo-cobalt relative overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="chip chip-cobalt">
              <Building2 size={11} strokeWidth={2.5} />
              EMPRESAS LOCAIS
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-ink lg:text-5xl">
              Apoie quem está<br />ao seu lado.
            </h1>
            <p className="mt-3 max-w-xl text-base text-mute lg:text-lg">
              Descubra negócios da sua região, conecte-se com lojistas e crie o seu próprio perfil.
            </p>
          </div>

          <Link to="/companies/manage" className="shrink-0">
            <span className="halo halo-cobalt inline-flex min-w-[16rem] items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 font-bold text-surface transition-all hover:-translate-y-0.5 hover:shadow-xl">
              {myCompany ? (
                <>
                  <Settings2 size={16} strokeWidth={2.2} />
                  Gerenciar empresa
                </>
              ) : (
                <>
                  <PlusCircle size={16} strokeWidth={2.2} />
                  Criar perfil da empresa
                </>
              )}
            </span>
          </Link>
        </div>
      </section>

      <label className="relative block">
        <Search
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Buscar por cidade"
          className="w-full rounded-2xl border border-line bg-ink/[0.03] py-3.5 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-2 focus:ring-coral/15 dark:bg-white/[0.04]"
        />
      </label>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !companies?.length ? (
        <div className="glass shape-signature flex flex-col items-center py-16 text-mute">
          <Building2 size={48} strokeWidth={1} />
          <p className="mt-3 font-display font-bold text-ink">Nenhuma empresa encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} to={`/companies/${company.slug}`}>
              <div className="glass shape-signature flex h-full gap-3 p-4 transition-all hover:-translate-y-0.5">
                <Avatar
                  src={company.logoUrl}
                  name={company.name}
                  size="lg"
                  accent="cobalt"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate font-display text-sm font-bold text-ink">
                      {company.name}
                    </p>
                    {company.isVerified && (
                      <BadgeCheck size={14} className="shrink-0 fill-cobalt text-surface" />
                    )}
                  </div>
                  {company.category && (
                    <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                      {company.category}
                    </p>
                  )}
                  {company.city && (
                    <p className="mt-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-mute">
                      <MapPin size={10} />
                      {company.city}
                    </p>
                  )}
                  {company.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-mute">
                      {company.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
