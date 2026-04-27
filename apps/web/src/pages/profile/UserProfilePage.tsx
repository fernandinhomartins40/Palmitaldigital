import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar, Button, Card, Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useUserFeed } from '../../hooks/useUserFeed';
import { InfiniteList } from '../../components/shared/InfiniteList';
import { FeedCard } from '../../components/feed/FeedCard';
import { BadgeCheck, Building2, MapPin, MessageCircle, Rss, UserRound } from 'lucide-react';

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);

  if (!id) return null;
  if (currentUser?.id === id && searchParams.get('preview') !== 'public') {
    return <Navigate to="/profile" replace />;
  }

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data as any;
    },
  });

  const {
    data: postsData,
    isLoading: isLoadingPosts,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUserFeed(id);

  const startChatMutation = useMutation({
    mutationFn: () => api.post('/chat/conversations', { recipientId: id }),
    onSuccess: (res) => navigate(`/chat/${res.data.id}`),
    onError: () => addToast('Erro ao iniciar conversa', 'error'),
  });

  const posts = useMemo(() => postsData?.pages.flatMap((page) => page.posts) ?? [], [postsData]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!profile) return null;

  const publicProfile = profile.profile;
  const displayName = publicProfile?.displayName ?? 'Usuário';
  const memberSince = new Date(profile.createdAt).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5 px-4 pb-6">
      <Card className="overflow-hidden p-0">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500" />
        <div className="px-4 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            <div className="rounded-3xl border-4 border-white bg-white shadow-sm">
              <Avatar src={publicProfile?.avatarUrl} name={displayName} size="lg" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                {profile.role === 'BUSINESS_OWNER' && (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">
                    Negócio local
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">Membro desde {memberSince}</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {publicProfile?.bio && <p className="text-sm leading-relaxed text-gray-700">{publicProfile.bio}</p>}

            {publicProfile?.city && (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={14} />
                {publicProfile.city}
              </p>
            )}

            {profile.company && (
              <Link
                to={`/companies/${profile.company.slug}`}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 transition-colors hover:border-blue-100 hover:bg-blue-50/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={profile.company.logoUrl} name={profile.company.name} size="md" />
                  <div>
                    <p className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      <Building2 size={14} className="text-blue-600" />
                      {profile.company.name}
                    </p>
                    <p className="text-xs text-gray-500">Ver empresa vinculada</p>
                  </div>
                </div>
                <BadgeCheck size={16} className="text-blue-500" />
              </Link>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Publicações</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{profile._count?.posts ?? posts.length}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Classificados</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{profile._count?.classifieds ?? 0}</p>
              </div>
            </div>

            <Button
              fullWidth
              onClick={() => startChatMutation.mutate()}
              isLoading={startChatMutation.isPending}
            >
              <MessageCircle size={16} />
              <span className="ml-2">Enviar mensagem</span>
            </Button>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Rss size={16} className="text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">Publicações deste perfil</h2>
        </div>

        {isLoadingPosts ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="px-4 py-8 text-center text-gray-500">
            <UserRound size={24} className="mx-auto mb-2 text-gray-300" />
            Este usuário ainda não publicou nada.
          </Card>
        ) : (
          <InfiniteList
            items={posts}
            renderItem={(post) => <FeedCard post={post as any} />}
            hasNextPage={!!hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        )}
      </section>
    </div>
  );
}
