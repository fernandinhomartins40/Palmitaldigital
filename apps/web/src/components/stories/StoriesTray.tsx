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
      if (storyPreviewUrl) {
        URL.revokeObjectURL(storyPreviewUrl);
      }
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
    if (storyPreviewUrl) {
      URL.revokeObjectURL(storyPreviewUrl);
    }
    setStoryFile(file);
    setStoryPreviewUrl(URL.createObjectURL(file));
    setCropFile(null);
  };

  const clearStoryFile = () => {
    if (storyPreviewUrl) {
      URL.revokeObjectURL(storyPreviewUrl);
    }
    setStoryFile(null);
    setStoryPreviewUrl(null);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

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
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Historias</h2>
        <button
          type="button"
          className="text-sm font-semibold text-blue-600"
          onClick={openCreateModal}
        >
          Criar historia
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          type="button"
          className="flex w-20 shrink-0 flex-col items-center gap-2"
          onClick={openCreateModal}
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

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Criar historia</h2>
                <p className="text-xs text-slate-500">A imagem fica disponivel por 24 horas.</p>
              </div>
              <button
                type="button"
                aria-label="Fechar criacao de historia"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => closeCreateModal()}
                disabled={createStoryMutation.isPending || isUploading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="flex min-h-[28rem] items-center justify-center bg-slate-950 p-4">
                <div className="relative aspect-[9/16] h-full max-h-[70vh] w-full max-w-[24rem] overflow-hidden rounded-[28px] bg-slate-900 shadow-2xl">
                  {storyPreviewUrl ? (
                    <>
                      <img src={storyPreviewUrl} alt="" className="h-full w-full object-cover" />
                      {caption.trim() ? (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                          <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-white">
                            {caption}
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="flex h-full w-full flex-col items-center justify-center gap-3 px-8 text-center text-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                        <ImagePlus size={28} />
                      </span>
                      <span className="text-sm font-semibold">Selecionar imagem</span>
                      <span className="text-xs leading-5 text-white/60">
                        Escolha uma foto e ajuste o recorte vertical antes de publicar.
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 p-4 md:border-l md:border-t-0">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={currentUser?.profile?.avatarUrl}
                    name={currentUser?.profile?.displayName ?? currentUser?.email ?? 'Usuario'}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {currentUser?.profile?.displayName ?? 'Sua historia'}
                    </p>
                    <p className="text-xs text-slate-500">Publicacao temporaria</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={createStoryMutation.isPending || isUploading}
                >
                  <Camera size={16} />
                  {storyFile ? 'Trocar imagem' : 'Selecionar imagem'}
                </button>

                {storyFile ? (
                  <button
                    type="button"
                    className="text-left text-sm font-semibold text-red-600 hover:text-red-700"
                    onClick={clearStoryFile}
                    disabled={createStoryMutation.isPending || isUploading}
                  >
                    Remover imagem
                  </button>
                ) : null}

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Legenda</span>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    maxLength={280}
                    rows={7}
                    placeholder="Escreva uma legenda..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Imagem vertical 9:16</span>
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
      ) : null}

      <ImageCropDialog
        open={Boolean(cropFile)}
        file={cropFile}
        title="Ajustar imagem da historia"
        aspect={9 / 16}
        outputWidth={1080}
        outputHeight={1920}
        quality={0.86}
        onCancel={() => setCropFile(null)}
        onConfirm={handleCropConfirm}
      />

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
