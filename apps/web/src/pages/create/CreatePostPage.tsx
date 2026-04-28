import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@palmital/ui';
import { PostType } from '@palmital/types';
import { api } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import { ImageUploader } from '../../components/shared/ImageUploader';

type TabType = 'social' | 'classified';

export function CreatePostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
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
    if (tab === 'social') {
      if (!content.trim() && mediaIds.length === 0) {
        addToast('Escreva algo ou adicione uma foto', 'error');
        return;
      }
      mutation.mutate({ type: PostType.SOCIAL, content, mediaIds });
    } else {
      if (!classified.title || !classified.description) {
        addToast('Preencha título e descrição', 'error');
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
  }

  return (
    <div className="px-4 pb-6">
      <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-6">
        <div className="mb-4 flex border-b">
          {(['social', 'classified'] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              {t === 'social' ? 'Publicação' : 'Classificado'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={tab === 'social' ? 'O que está acontecendo em Palmital?' : 'Descrição do anúncio (opcional)'}
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          {tab === 'classified' && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Título do anúncio *"
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
                  label="Descrição *"
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
                <label htmlFor="isFree" className="text-sm text-gray-700">É grátis</label>
              </div>
              {!classified.isFree && (
                <Input
                  label="Preço (R$)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={classified.price}
                  onChange={(e) => setClassified((c) => ({ ...c, price: e.target.value }))}
                />
              )}
            </div>
          )}

          <ImageUploader
            onUpload={(id) => setMediaIds((ids) => [...ids, id])}
            maxFiles={4}
          />

          <Button type="submit" fullWidth isLoading={mutation.isPending}>
            Publicar
          </Button>
        </form>
      </div>
    </div>
  );
}
