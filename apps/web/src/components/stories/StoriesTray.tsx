import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Spinner } from '@palmital/ui';
import { ChevronLeft, ChevronRight, Plus, Send, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useUpload } from '../../hooks/useUpload';

type StoryGroup = {
  author: any;
  hasUnseen: boolean;
  stories: any[];
};

function storyAuthorName(group?: StoryGroup) {
  return group?.author?.profile?.displayName ?? 'Usuario';
}

export function StoriesTray() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const addToast = useUIStore((state) => state.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useUpload();
  const [caption, setCaption] = useState('');
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['stories-feed'],
    queryFn: async () => {
      const { data } = await api.get('/stories/feed');
      return data as StoryGroup[];
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (file: File) => {
      const media = await upload(file);
      await api.post('/stories', { mediaId: media.id, caption: caption.trim() || undefined });
    },
    onSuccess: () => {
      setCaption('');
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['stories-feed'] });
      addToast('Historia publicada por 24 horas', 'success');
    },
    onError: (error: any) =>
      addToast(error.response?.data?.message ?? 'Erro ao publicar historia', 'error'),
  });

  const viewMutation = useMutation({
    mutationFn: (storyId: string) => api.post(`/stories/${storyId}/view`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories-feed'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (storyId: string) => api.delete(`/stories/${storyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories-feed'] });
      closeViewer();
    },
    onError: () => addToast('Erro ao remover historia', 'error'),
  });

  const selectedGroup = selectedGroupIndex != null ? groups[selectedGroupIndex] : undefined;
  const selectedStory = selectedGroup?.stories[selectedStoryIndex];
  const isOwnStory = selectedStory?.authorId === currentUser?.id;

  useEffect(() => {
    if (selectedStory?.id && !selectedStory.seenByViewer) {
      viewMutation.mutate(selectedStory.id);
    }
  }, [selectedStory?.id]);

  const orderedGroups = useMemo(() => {
    if (!currentUser) return groups;
    return [...groups].sort((a, b) => {
      if (a.author.id === currentUser.id) return -1;
      if (b.author.id === currentUser.id) return 1;
      return Number(b.hasUnseen) - Number(a.hasUnseen);
    });
  }, [groups, currentUser]);

  const openViewer = (group: StoryGroup) => {
    const index = groups.findIndex((item) => item.author.id === group.author.id);
    if (index >= 0) {
      setSelectedGroupIndex(index);
      setSelectedStoryIndex(0);
    }
  };

  const closeViewer = () => {
    setSelectedGroupIndex(null);
    setSelectedStoryIndex(0);
  };

  const goPrevious = () => {
    if (selectedGroupIndex == null || !selectedGroup) return;
    if (selectedStoryIndex > 0) {
      setSelectedStoryIndex((value) => value - 1);
      return;
    }
    const previousGroupIndex = selectedGroupIndex > 0 ? selectedGroupIndex - 1 : groups.length - 1;
    setSelectedGroupIndex(previousGroupIndex);
    setSelectedStoryIndex(Math.max(0, groups[previousGroupIndex].stories.length - 1));
  };

  const goNext = () => {
    if (selectedGroupIndex == null || !selectedGroup) return;
    if (selectedStoryIndex < selectedGroup.stories.length - 1) {
      setSelectedStoryIndex((value) => value + 1);
      return;
    }
    const nextGroupIndex = selectedGroupIndex < groups.length - 1 ? selectedGroupIndex + 1 : 0;
    setSelectedGroupIndex(nextGroupIndex);
    setSelectedStoryIndex(0);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    createStoryMutation.mutate(file);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Historias</h2>
        <button
          type="button"
          className="text-sm font-semibold text-blue-600"
          onClick={() => setIsCreating((value) => !value)}
        >
          Criar historia
        </button>
      </div>

      {isCreating ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
          <div className="flex gap-2">
            <input
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={280}
              placeholder="Legenda opcional"
              className="min-w-0 flex-1 rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              isLoading={createStoryMutation.isPending || isUploading}
            >
              <Send size={15} />
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Use imagem ou video vertical 9:16. A historia expira em 24 horas.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,video/mp4"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          type="button"
          className="flex w-20 shrink-0 flex-col items-center gap-2"
          onClick={() => setIsCreating(true)}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600">
            <Plus size={22} />
          </div>
          <span className="line-clamp-2 text-center text-xs font-medium text-slate-600">
            Nova historia
          </span>
        </button>

        {isLoading ? (
          <div className="flex h-20 items-center px-4">
            <Spinner size="sm" />
          </div>
        ) : (
          orderedGroups.map((group) => (
            <button
              key={group.author.id}
              type="button"
              className="flex w-20 shrink-0 flex-col items-center gap-2"
              onClick={() => openViewer(group)}
            >
              <div
                className={`rounded-full p-0.5 ${group.hasUnseen ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <Avatar
                  src={group.author.profile?.avatarUrl}
                  name={storyAuthorName(group)}
                  size="lg"
                  className="h-16 w-16 border-2 border-white"
                />
              </div>
              <span className="line-clamp-2 text-center text-xs font-medium text-slate-600">
                {group.author.id === currentUser?.id ? 'Sua historia' : storyAuthorName(group)}
              </span>
            </button>
          ))
        )}
      </div>

      {selectedStory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4">
          <button
            type="button"
            aria-label="Fechar historias"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={closeViewer}
          >
            <X size={20} />
          </button>

          <button
            type="button"
            aria-label="Historia anterior"
            className="absolute left-3 top-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            onClick={goPrevious}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="relative aspect-[9/16] max-h-[88vh] w-full max-w-[28rem] overflow-hidden rounded-[28px] bg-black">
            <div className="absolute left-3 right-3 top-3 z-10 flex gap-1">
              {selectedGroup?.stories.map((story: any, index: number) => (
                <div key={story.id} className="h-1 flex-1 rounded-full bg-white/30">
                  <div
                    className={`h-full rounded-full bg-white ${index <= selectedStoryIndex ? 'w-full' : 'w-0'}`}
                  />
                </div>
              ))}
            </div>

            <div className="absolute left-4 right-4 top-7 z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white">
                <Avatar
                  src={selectedGroup?.author.profile?.avatarUrl}
                  name={storyAuthorName(selectedGroup)}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-semibold">{storyAuthorName(selectedGroup)}</p>
                  <p className="text-xs text-white/70">
                    {selectedStory._count?.views ?? 0} visualizacao(oes)
                  </p>
                </div>
              </div>

              {isOwnStory ? (
                <button
                  type="button"
                  className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  onClick={() => deleteMutation.mutate(selectedStory.id)}
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>

            {selectedStory.media?.type === 'VIDEO' ? (
              <video
                src={selectedStory.media.url}
                controls
                autoPlay
                className="h-full w-full object-cover"
              />
            ) : (
              <img src={selectedStory.media?.url} alt="" className="h-full w-full object-cover" />
            )}

            {selectedStory.caption ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                <p className="text-sm font-medium leading-6 text-white">{selectedStory.caption}</p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Proxima historia"
            className="absolute right-3 top-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            onClick={goNext}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
