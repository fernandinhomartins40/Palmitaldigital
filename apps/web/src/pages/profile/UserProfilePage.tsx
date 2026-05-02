import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useUserFeed } from '../../hooks/useUserFeed';
import { InfiniteList } from '../../components/shared/InfiniteList';
import { FeedCard } from '../../components/feed/FeedCard';
import {
  AtSign,
  BadgeCheck,
  Building2,
  CalendarDays,
  Grid3X3,
  Image,
  Info,
  MapPin,
  MessageCircle,
  Rss,
  UserRound,
  Users,
} from 'lucide-react';

type ProfileTab = 'posts' | 'photos' | 'followers' | 'following' | 'about';

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);

  if (!id) return null;

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

  const followMutation = useMutation({
    mutationFn: () =>
      profile?.isFollowing ? api.delete(`/users/${id}/follow`) : api.post(`/users/${id}/follow`),
    onSuccess: (res) => {
      queryClient.setQueryData(['public-profile', id], res.data);
      queryClient.invalidateQueries({ queryKey: ['stories-feed'] });
    },
    onError: () => addToast('Erro ao atualizar seguidores', 'error'),
  });

  const followersQuery = useQuery({
    queryKey: ['followers', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}/followers`);
      return data as any[];
    },
    enabled: activeTab === 'followers',
  });

  const followingQuery = useQuery({
    queryKey: ['following', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}/following`);
      return data as any[];
    },
    enabled: activeTab === 'following',
  });

  const posts = useMemo(() => postsData?.pages.flatMap((page) => page.posts) ?? [], [postsData]);
  const photos = useMemo(
    () =>
      posts.flatMap((post: any) =>
        (post.media ?? [])
          .filter((media: any) => media.type !== 'VIDEO')
          .map((media: any) => ({ ...media, postId: post.id })),
      ),
    [posts],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) return null;

  const publicProfile = profile.profile;
  const displayName = publicProfile?.displayName ?? 'Usuario';
  const username = publicProfile?.username ? `@${publicProfile.username}` : null;
  const memberSince = new Date(profile.createdAt).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  const tabs: Array<{ id: ProfileTab; label: string; icon: any; count?: number }> = [
    { id: 'posts', label: 'Publicacoes', icon: Rss, count: profile._count?.posts ?? posts.length },
    { id: 'photos', label: 'Fotos', icon: Image, count: photos.length },
    { id: 'followers', label: 'Seguidores', icon: Users, count: profile._count?.followers ?? 0 },
    { id: 'following', label: 'Seguindo', icon: UserRound, count: profile._count?.following ?? 0 },
    { id: 'about', label: 'Mais informacoes', icon: Info },
  ];

  const renderFollowList = (items: any[] | undefined, kind: 'followers' | 'following') => {
    if (!items) {
      return (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      );
    }

    if (!items.length) {
      return (
        <Card className="px-4 py-8 text-center text-gray-500">
          <Users size={24} className="mx-auto mb-2 text-gray-300" />
          {kind === 'followers' ? 'Nenhum seguidor ainda.' : 'Ainda nao segue ninguem.'}
        </Card>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const user = kind === 'followers' ? item.follower : item.following;
          const name = user?.profile?.displayName ?? 'Usuario';

          return (
            <Link
              key={item.id}
              to={`/profile/${user.id}`}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 transition hover:border-blue-100 hover:bg-blue-50/40"
            >
              <Avatar src={user?.profile?.avatarUrl} name={name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">
                  {user?.profile?.username ? `@${user.profile.username}` : user?.profile?.city || 'Perfil'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5 px-4 pb-6">
      <Card className="overflow-hidden border-blue-100/80 p-0 shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
        <div className="relative h-44 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 sm:h-56 lg:h-72">
          {publicProfile?.coverUrl ? (
            <img src={publicProfile.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
        </div>

        <div className="px-4 pb-5 pt-4 lg:px-8 lg:pb-8 lg:pt-0">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
            <div className="lg:flex lg:min-w-0 lg:flex-1 lg:items-end lg:gap-5">
              <div className="-mt-14 inline-flex lg:-mt-20">
                <div className="rounded-[28px] border-4 border-white bg-white shadow-lg shadow-blue-900/10">
                  <Avatar
                    src={publicProfile?.avatarUrl}
                    name={displayName}
                    size="lg"
                    className="h-24 w-24 text-3xl lg:h-36 lg:w-36 lg:text-5xl"
                  />
                </div>
              </div>

              <div className="mt-4 min-w-0 space-y-2 lg:mt-0 lg:pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold leading-tight text-gray-900 lg:text-[2.35rem]">
                    {displayName}
                  </h1>
                  {profile.role === 'BUSINESS_OWNER' && (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">
                      Negocio local
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {username ? (
                    <span className="flex items-center gap-1">
                      <AtSign size={14} />
                      {username.replace('@', '')}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    Membro desde {memberSince}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:w-[22rem]">
              {profile.isSelf ? (
                <Link to="/profile" className="sm:col-span-2">
                  <Button fullWidth variant="secondary">
                    Gerenciar perfil
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    fullWidth
                    variant={profile.isFollowing ? 'secondary' : 'primary'}
                    onClick={() => followMutation.mutate()}
                    isLoading={followMutation.isPending}
                  >
                    {profile.isFollowing ? 'Deixar de seguir' : 'Seguir perfil'}
                  </Button>
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => startChatMutation.mutate()}
                    isLoading={startChatMutation.isPending}
                  >
                    <MessageCircle size={16} />
                    <span className="ml-2">Mensagem</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-5 lg:mt-7">
            {publicProfile?.bio && (
              <p className="max-w-4xl text-sm leading-relaxed text-gray-700 lg:text-base">
                {publicProfile.bio}
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

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-left transition hover:border-blue-100 hover:bg-blue-50/50"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Publicacoes
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {profile._count?.posts ?? posts.length}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-left transition hover:border-blue-100 hover:bg-blue-50/50"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Fotos
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">{photos.length}</p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('followers')}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-left transition hover:border-blue-100 hover:bg-blue-50/50"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Seguidores
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {profile._count?.followers ?? 0}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('following')}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-left transition hover:border-blue-100 hover:bg-blue-50/50"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Seguindo
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {profile._count?.following ?? 0}
                </p>
              </button>
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="overflow-x-auto border-b border-gray-200">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.count !== undefined ? (
                    <span className={isActive ? 'text-blue-500' : 'text-gray-400'}>{tab.count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'posts' && isLoadingPosts ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : null}

        {activeTab === 'posts' && !isLoadingPosts && posts.length === 0 ? (
          <Card className="px-4 py-8 text-center text-gray-500">
            <UserRound size={24} className="mx-auto mb-2 text-gray-300" />
            Este usuario ainda nao publicou nada.
          </Card>
        ) : null}

        {activeTab === 'posts' && posts.length > 0 ? (
          <InfiniteList
            items={posts}
            renderItem={(post) => <FeedCard post={post as any} />}
            hasNextPage={!!hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        ) : null}

        {activeTab === 'photos' ? (
          photos.length ? (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {photos.map((media: any) => (
                <Link
                  key={media.id}
                  to={`/feed?post=${media.postId}`}
                  className="group relative aspect-square overflow-hidden bg-gray-100"
                >
                  <img
                    src={media.url}
                    alt=""
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <Card className="px-4 py-8 text-center text-gray-500">
              <Grid3X3 size={24} className="mx-auto mb-2 text-gray-300" />
              Nenhuma foto publicada ainda.
            </Card>
          )
        ) : null}

        {activeTab === 'followers'
          ? renderFollowList(followersQuery.data, 'followers')
          : null}

        {activeTab === 'following'
          ? renderFollowList(followingQuery.data, 'following')
          : null}

        {activeTab === 'about' ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-4 p-4 lg:p-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sobre {displayName}</h2>
                <p className="text-sm text-gray-500">Informacoes publicas do perfil.</p>
              </div>
              <div className="grid gap-3 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <UserRound size={16} className="text-gray-400" />
                  {displayName}
                </p>
                {username ? (
                  <p className="flex items-center gap-2">
                    <AtSign size={16} className="text-gray-400" />
                    {username}
                  </p>
                ) : null}
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  {publicProfile?.city || 'Cidade nao informada'}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-gray-400" />
                  Membro desde {memberSince}
                </p>
              </div>
              {publicProfile?.bio ? (
                <p className="rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                  {publicProfile.bio}
                </p>
              ) : null}
            </Card>

            <Card className="space-y-4 p-4 lg:p-6">
              <h2 className="text-lg font-bold text-gray-900">Resumo</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Publicacoes</p>
                  <p className="text-xl font-bold text-gray-900">{profile._count?.posts ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Classificados</p>
                  <p className="text-xl font-bold text-gray-900">
                    {profile._count?.classifieds ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Seguidores</p>
                  <p className="text-xl font-bold text-gray-900">
                    {profile._count?.followers ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Seguindo</p>
                  <p className="text-xl font-bold text-gray-900">
                    {profile._count?.following ?? 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </section>
    </div>
  );
}
