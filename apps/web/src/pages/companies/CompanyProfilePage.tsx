import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Spinner } from '@palmital/ui';
import { formatCurrency } from '@palmital/utils';
import { api } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import { BadgeCheck, MapPin, Phone } from 'lucide-react';

export function CompanyProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', slug],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${slug}`);
      return data as any;
    },
  });

  const startChatMutation = useMutation({
    mutationFn: () => api.post('/chat/conversations', { recipientId: company.ownerId }),
    onSuccess: (res) => navigate(`/chat/${res.data.id}`),
    onError: () => addToast('Erro ao iniciar conversa', 'error'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!company) return null;

  return (
    <div className="pb-6">
      {company.coverUrl && (
        <div className="h-40 bg-gray-200 overflow-hidden">
          <img src={company.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        <div className="flex items-start gap-4">
          <Avatar src={company.logoUrl} name={company.name} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
              {company.isVerified && <BadgeCheck size={18} className="text-blue-500" />}
            </div>
            {company.category && <p className="text-sm text-gray-500">{company.category}</p>}
          </div>
        </div>

        {company.description && <p className="text-gray-700">{company.description}</p>}

        <div className="space-y-1 text-sm text-gray-600">
          {company.city && <p className="flex items-center gap-2"><MapPin size={14} />{company.address ? `${company.address}, ${company.city}` : company.city}</p>}
          {company.phone && <p className="flex items-center gap-2"><Phone size={14} />{company.phone}</p>}
        </div>

        <Button fullWidth onClick={() => startChatMutation.mutate()} isLoading={startChatMutation.isPending}>
          Enviar mensagem
        </Button>

        {company.products?.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-bold text-gray-900">Catálogo</h2>
            <div className="grid grid-cols-2 gap-3">
              {company.products.map((product: any) => (
                <Card key={product.id} className="overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-32 w-full object-cover" />
                  ) : (
                    <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-300 text-xs">sem foto</div>
                  )}
                  <div className="p-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    {product.price && <p className="text-sm font-bold text-blue-600">{formatCurrency(Number(product.price))}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
