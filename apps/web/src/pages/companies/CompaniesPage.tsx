import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Avatar, Card, Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { BadgeCheck, Building2 } from 'lucide-react';
import { useState } from 'react';

export function CompaniesPage() {
  const [city, setCity] = useState('');

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies', city],
    queryFn: async () => {
      const params: any = {};
      if (city) params.city = city;
      const { data } = await api.get('/companies', { params });
      return data as any[];
    },
  });

  return (
    <div className="px-4 pb-6">
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Buscar por cidade..."
        className="mb-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !companies?.length ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Building2 size={48} strokeWidth={1} />
          <p className="mt-3">Nenhuma empresa encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {companies.map((company) => (
            <Link key={company.id} to={`/companies/${company.slug}`}>
              <Card className="flex flex-col items-center p-4 text-center hover:shadow-md transition-shadow">
                <Avatar src={company.logoUrl} name={company.name} size="lg" />
                <div className="mt-2 flex items-center gap-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">{company.name}</p>
                  {company.isVerified && <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />}
                </div>
                {company.category && <p className="text-xs text-gray-500">{company.category}</p>}
                {company.city && <p className="text-xs text-gray-400">{company.city}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
