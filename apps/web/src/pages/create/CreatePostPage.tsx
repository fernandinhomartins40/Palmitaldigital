import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@palmital/ui';
import { PostType } from '@palmital/types';
import { ImageUploader } from '../../components/shared/ImageUploader';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

type TabType = 'social' | 'classified' | 'business';

export function CreatePostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const currentUser = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TabType>('social');
  const [content, setContent] = useState('');
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [classified, setClassified] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    isFree: false,
  });

  const { data: myCompany } = useQuery({
    queryKey: ['my-company'],
    enabled: currentUser?.role === 'BUSINESS_OWNER',
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get('/companies/me');
        return data as any;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const availableTabs: TabType[] = myCompany
    ? ['social', 'classified', 'business']
    : ['social', 'classified'];

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post('/posts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      addToast('Publicado com sucesso!', 'success');
      navigate('/feed');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Erro ao publicar', 'error');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (tab === 'social' || tab === 'business') {
      if (!content.trim() && mediaIds.length === 0) {
        addToast('Escreva algo ou adicione uma foto', 'error');
        return;
      }

      mutation.mutate({
        type: tab === 'business' ? PostType.BUSINESS : PostType.SOCIAL,
        content,
        mediaIds,
        companyId: tab === 'business' ? myCompany?.id : undefined,
      });
      return;
    }

    if (!classified.title || !classified.description) {
      addToast('Preencha titulo e descricao', 'error');
      return;
    }

    mutation.mutate({
      type: PostType.CLASSIFIED,
      content,
      mediaIds,
      classified: {
        ...classified,
        price: classified.isFree ? undefined : classified.price ? Number(classified.price) : undefined,
      },
    });
  }

  return (
    <div className="px-4 pb-6">
      <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-6">
        <div className="mb-4 flex border-b">
          {availableTabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${
                tab === item ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              {item === 'social' ? 'Publicacao' : item === 'classified' ? 'Classificado' : 'Empresa'}
            </button>
          ))}
        </div>

        {tab === 'business' && myCompany ? (
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Esta publicacao sera exibida como conteudo oficial da empresa <strong>{myCompany.name}</strong>.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              tab === 'classified'
                ? 'Descricao do anuncio (opcional)'
                : tab === 'business'
                  ? 'Compartilhe novidades, promocoes ou atualizacoes da sua empresa'
                  : 'O que esta acontecendo em Palmital?'
            }
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          {tab === 'classified' && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Titulo do anuncio *"
                value={classified.title}
                onChange={(e) => setClassified((c) => ({ ...c, title: e.target.value }))}
                required
                maxLength={200}
              />
              <Input
                label="Cidade"
                value={classified.city}
                onChange={(e) => setClassified((c) => ({ ...c, city: e.target.value }))}
                placeholder="Palmital"
              />
              <div className="md:col-span-2">
                <Input
                  label="Descricao *"
                  value={classified.description}
                  onChange={(e) => setClassified((c) => ({ ...c, description: e.target.value }))}
                  required
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 md:col-span-2">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={classified.isFree}
                  onChange={(e) => setClassified((c) => ({ ...c, isFree: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="isFree" className="text-sm text-gray-700">
                  E gratis
                </label>
              </div>
              {!classified.isFree && (
                <Input
                  label="Preco (R$)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={classified.price}
                  onChange={(e) => setClassified((c) => ({ ...c, price: e.target.value }))}
                />
              )}
            </div>
          )}

          <ImageUploader onUpload={(id) => setMediaIds((ids) => [...ids, id])} maxFiles={4} />

          <Button type="submit" fullWidth isLoading={mutation.isPending}>
            Publicar
          </Button>
        </form>
      </div>
    </div>
  );
}
