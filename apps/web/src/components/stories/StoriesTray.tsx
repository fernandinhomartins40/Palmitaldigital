import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Spinner } from '@palmital/ui';
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useUpload } from '../../hooks/useUpload';
import { ImageCropDialog } from '../shared/ImageCropDialog';

type StoryGroup = {
  author: any;
  hasUnseen: boolean;
  stories: any[];
};

const STORY_IMAGE_WIDTH = 1080;
const STORY_IMAGE_HEIGHT = 1920;
const STORY_IMAGE_ASPECT = STORY_IMAGE_WIDTH / STORY_IMAGE_HEIGHT;

const accents = ['coral', 'citrus', 'cobalt', 'magenta', 'mint', 'amber'] as const;
type Accent = (typeof accents)[number];

function pickAccent(id: string): Accent {
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return accents[hash % accents.length];
}

const accentBg: Record<Accent, string> = {
  coral: 'bg-coral',
  citrus: 'bg-citrus',
  cobalt: 'bg-cobalt',
  magenta: 'bg-magenta',
  mint: 'bg-mint',
  amber: 'bg-amber',
};

const accentHalo: Record<Accent, string> = {
  coral: 'halo-coral',
  citrus: 'halo-citrus',
  cobalt: 'halo-cobalt',
  magenta: 'halo-magenta',
  mint: 'halo-mint',
  amber: 'halo-amber',
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
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreviewUrl, setStoryPreviewUrl] = useState<string | null>(null);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['stories-feed'],
    queryFn: async () => {
      const { data } = await api.get('/stories/feed');
      return data as StoryGroup[];
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption: string }) => {
      const media = await upload(file);
      await api.post('/stories', { mediaId: media.id, caption: caption.trim() || undefined });
    },
    onSuccess: () => {
      closeCreateModal(true);
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

  useEffect(() => {
    return () => {
      if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
    };
  }, [storyPreviewUrl]);

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
    if (!file.type.startsWith('image/')) {
      addToast('Selecione uma imagem para criar a historia', 'error');
      return;
    }
    setCropFile(file);
  };

  const handleCropConfirm = (file: File) => {
    if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
    setStoryFile(file);
    setStoryPreviewUrl(URL.createObjectURL(file));
    setCropFile(null);
  };

  const clearStoryFile = () => {
    if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
    setStoryFile(null);
    setStoryPreviewUrl(null);
  };

  const openCreateModal = () => setIsCreateModalOpen(true);

  const closeCreateModal = (force = false) => {
    if (!force && (createStoryMutation.isPending || isUploading)) return;
    setIsCreateModalOpen(false);
    setCaption('');
    setCropFile(null);
    clearStoryFile();
  };

  const publishStory = () => {
    if (!storyFile) {
      addToast('Selecione uma imagem para publicar', 'error');
      return;
    }
    createStoryMutation.mutate({ file: storyFile, caption });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink">
          24h <span className="text-mute">/</span> Histórias
        </h2>
        <button
          type="button"
          className="font-mono text-[10px] font-bold uppercase tracking-wider text-coral hover:underline"
          onClick={openCreateModal}
        >
          + Criar
        </button>
      </div>

      <div className="glass-scrollbar flex gap-3 overflow-x-auto pb-2">
        <button
          type="button"
          className="group flex w-20 shrink-0 flex-col items-center gap-2"
          onClick={openCreateModal}
        >
          {/* Shape assinatura no lugar do círculo */}
          <div className="flex h-16 w-16 items-center justify-center border-2 border-dashed border-mute bg-ink/[0.03] text-mute transition-all group-hover:border-coral group-hover:text-coral dark:bg-white/[0.03]"
               style={{ borderRadius: '24px 24px 8px 24px' }}>
            <Plus size={22} strokeWidth={2.2} />
          </div>
          <span className="line-clamp-2 text-center text-[11px] font-medium text-mute">Nova</span>
        </button>

        {isLoading ? (
          <div className="flex h-20 items-center px-4">
            <Spinner size="sm" />
          </div>
        ) : (
          orderedGroups.map((group) => {
            const accent = pickAccent(group.author.id);
            const isOwn = group.author.id === currentUser?.id;

            return (
              <button
                key={group.author.id}
                type="button"
                className="group flex w-20 shrink-0 flex-col items-center gap-2"
                onClick={() => openViewer(group)}
              >
                <div className="relative">
                  {/* Halo de cor */}
                  {group.hasUnseen && (
                    <div className={`halo ${accentHalo[accent]} absolute inset-0`} />
                  )}
                  {/* Shape de cor (substitui anel) */}
                  <div
                    className={`relative flex h-16 w-16 items-center justify-center p-[3px] transition-transform group-hover:scale-105 ${
                      group.hasUnseen ? accentBg[accent] : 'bg-line'
                    }`}
                    style={{ borderRadius: '24px 24px 8px 24px' }}
                  >
                    <div
                      className="h-full w-full overflow-hidden bg-surface"
                      style={{ borderRadius: '20px 20px 4px 20px' }}
                    >
                      <Avatar
                        src={group.author.profile?.avatarUrl}
                        name={storyAuthorName(group)}
                        size="lg"
                        className="!h-full !w-full !rounded-none !ring-0"
                        accent={accent}
                      />
                    </div>
                  </div>
                </div>
                <span className="line-clamp-2 text-center text-[11px] font-medium text-ink">
                  {isOwn ? 'Você' : storyAuthorName(group)}
                </span>
              </button>
            );
          })
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="glass-strong shape-signature-lg flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Criar história</h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                  Disponível por 24 horas
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar criação de história"
                className="rounded-xl p-2 text-mute hover:bg-ink/5 hover:text-ink"
                onClick={() => closeCreateModal()}
                disabled={createStoryMutation.isPending || isUploading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="flex min-h-[28rem] items-center justify-center bg-ink p-4">
                <div
                  className="relative aspect-[9/16] h-full max-h-[70vh] w-full max-w-[24rem] overflow-hidden bg-canvas shadow-2xl"
                  style={{ borderRadius: '32px 32px 12px 32px' }}
                >
                  {storyPreviewUrl ? (
                    <>
                      <img src={storyPreviewUrl} alt="" className="h-full w-full object-cover" />
                      {caption.trim() && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                          <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-white">
                            {caption}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="flex h-full w-full flex-col items-center justify-center gap-3 px-8 text-center text-surface"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-coral text-white">
                        <ImagePlus size={28} />
                      </span>
                      <span className="font-display text-sm font-bold">Selecionar imagem</span>
                      <span className="text-xs leading-5 text-surface/60">
                        Escolha uma foto e ajuste o recorte vertical.
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-line p-5 md:border-l md:border-t-0">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={currentUser?.profile?.avatarUrl}
                    name={currentUser?.profile?.displayName ?? currentUser?.email ?? 'Usuario'}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-ink">
                      {currentUser?.profile?.displayName ?? 'Você'}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                      Temporária
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-glass flex items-center justify-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={createStoryMutation.isPending || isUploading}
                >
                  <Camera size={16} />
                  {storyFile ? 'Trocar imagem' : 'Selecionar imagem'}
                </button>

                {storyFile && (
                  <button
                    type="button"
                    className="text-left text-xs font-bold uppercase tracking-wider text-coral hover:underline"
                    onClick={clearStoryFile}
                    disabled={createStoryMutation.isPending || isUploading}
                  >
                    Remover
                  </button>
                )}

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-mute">Legenda</span>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    maxLength={280}
                    rows={6}
                    placeholder="Escreva uma legenda..."
                    className="w-full resize-none rounded-2xl border border-line bg-ink/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-coral focus:bg-surface focus:ring-2 focus:ring-coral/20 dark:bg-white/[0.03]"
                  />
                </label>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-mute">
                  <span>1080 × 1920</span>
                  <span>{caption.length}/280</span>
                </div>

                <div className="mt-auto flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => closeCreateModal()}
                    disabled={createStoryMutation.isPending || isUploading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    fullWidth
                    onClick={publishStory}
                    disabled={!storyFile}
                    isLoading={createStoryMutation.isPending || isUploading}
                  >
                    Publicar
                  </Button>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      )}

      <ImageCropDialog
        open={Boolean(cropFile)}
        file={cropFile}
        title="Ajustar imagem da história"
        aspect={STORY_IMAGE_ASPECT}
        outputWidth={STORY_IMAGE_WIDTH}
        outputHeight={STORY_IMAGE_HEIGHT}
        quality={0.86}
        onCancel={() => setCropFile(null)}
        onConfirm={handleCropConfirm}
      />

      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-0 sm:p-4">
          <button
            type="button"
            aria-label="Fechar histórias"
            className="absolute right-4 top-4 z-10 rounded-xl bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
            onClick={closeViewer}
          >
            <X size={20} />
          </button>

          <button
            type="button"
            aria-label="História anterior"
            className="absolute left-3 top-1/2 z-10 rounded-xl bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20"
            onClick={goPrevious}
          >
            <ChevronLeft size={24} />
          </button>

          <div
            className="relative h-[100dvh] w-screen overflow-hidden bg-black sm:aspect-[9/16] sm:h-auto sm:max-h-[88vh] sm:w-full sm:max-w-[28rem]"
            style={{ borderRadius: '32px 32px 12px 32px' }}
          >
            <div className="absolute left-3 right-3 top-3 z-10 flex gap-1">
              {selectedGroup?.stories.map((story: any, index: number) => (
                <div key={story.id} className="h-1 flex-1 rounded-full bg-white/25">
                  <div
                    className={`h-full rounded-full bg-coral ${
                      index <= selectedStoryIndex ? 'w-full' : 'w-0'
                    }`}
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
                  <p className="font-display text-sm font-bold">{storyAuthorName(selectedGroup)}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/70">
                    {selectedStory._count?.views ?? 0} visualizações
                  </p>
                </div>
              </div>

              {isOwnStory && (
                <button
                  type="button"
                  className="rounded-xl bg-white/10 p-2 text-white backdrop-blur hover:bg-coral"
                  onClick={() => deleteMutation.mutate(selectedStory.id)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {selectedStory.media?.type === 'VIDEO' ? (
              <video src={selectedStory.media.url} controls autoPlay className="h-full w-full object-cover" />
            ) : (
              <img src={selectedStory.media?.url} alt="" className="h-full w-full object-cover" />
            )}

            {selectedStory.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                <p className="text-sm font-medium leading-6 text-white">{selectedStory.caption}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Próxima história"
            className="absolute right-3 top-1/2 z-10 rounded-xl bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20"
            onClick={goNext}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </section>
  );
}
