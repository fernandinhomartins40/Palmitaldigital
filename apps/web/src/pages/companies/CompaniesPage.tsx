import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { BadgeCheck, Building2, PlusCircle, Settings2 } from 'lucide-react';
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
    <div className="space-y-5 px-4 pb-6 lg:px-0">
      <Card className="rounded-[28px] border-blue-100/80 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 p-5 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Empresas locais</p>
            <h1 className="mt-2 text-2xl font-bold">Crie e gerencie o perfil completo da sua loja</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-50">
              Configure identidade visual, informacoes comerciais, catalogo de produtos e a pagina publica da empresa.
            </p>
          </div>

          <Link to="/companies/manage" className="shrink-0">
            <Button className="min-w-[16rem] rounded-2xl bg-white text-blue-700 hover:bg-blue-50">
              {myCompany ? <Settings2 size={16} /> : <PlusCircle size={16} />}
              <span className="ml-2">{myCompany ? 'Gerenciar minha empresa' : 'Criar perfil da empresa'}</span>
            </Button>
          </Link>
        </div>
      </Card>

      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Buscar empresas por cidade..."
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !companies?.length ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Building2 size={48} strokeWidth={1} />
          <p className="mt-3">Nenhuma empresa encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} to={`/companies/${company.slug}`}>
              <Card className="flex h-full gap-4 rounded-[28px] p-4 transition-shadow hover:shadow-md">
                <Avatar src={company.logoUrl} name={company.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{company.name}</p>
                    {company.isVerified && <BadgeCheck size={14} className="shrink-0 text-blue-500" />}
                  </div>
                  {company.category && <p className="text-xs text-gray-500">{company.category}</p>}
                  {company.city && <p className="mt-1 text-xs text-gray-400">{company.city}</p>}
                  {company.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{company.description}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
