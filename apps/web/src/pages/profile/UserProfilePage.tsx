import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Spinner } from '@palmital/ui';
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

const tabAccent: Record<ProfileTab, string> = {
  posts: 'coral',
  photos: 'citrus',
  followers: 'cobalt',
  following: 'magenta',
  about: 'mint',
};

const dotByTab: Record<ProfileTab, string> = {
  posts: 'bg-coral',
  photos: 'bg-citrus',
  followers: 'bg-cobalt',
  following: 'bg-magenta',
  about: 'bg-mint',
};

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
    { id: 'posts', label: 'Publicações', icon: Rss, count: profile._count?.posts ?? posts.length },
    { id: 'photos', label: 'Fotos', icon: Image, count: photos.length },
    { id: 'followers', label: 'Seguidores', icon: Users, count: profile._count?.followers ?? 0 },
    { id: 'following', label: 'Seguindo', icon: UserRound, count: profile._count?.following ?? 0 },
    { id: 'about', label: 'Sobre', icon: Info },
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
        <div className="glass shape-signature px-4 py-8 text-center text-mute">
          <Users size={24} className="mx-auto mb-2 text-subtle" />
          {kind === 'followers' ? 'Nenhum seguidor ainda.' : 'Ainda não segue ninguém.'}
        </div>
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
              className="glass flex items-center gap-3 rounded-2xl p-3 transition-all hover:-translate-y-0.5"
            >
              <Avatar src={user?.profile?.avatarUrl} name={name} size="md" />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-ink">{name}</p>
                <p className="truncate font-mono text-[10px] uppercase tracking-wider text-mute">
                  {user?.profile?.username ? `@${user.profile.username}` : user?.profile?.city || 'Perfil'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  const statTabs: Array<{ tab: ProfileTab; label: string; value: number; accent: string }> = [
    { tab: 'posts', label: 'Publicações', value: profile._count?.posts ?? posts.length, accent: 'bg-coral' },
    { tab: 'photos', label: 'Fotos', value: photos.length, accent: 'bg-citrus' },
    { tab: 'followers', label: 'Seguidores', value: profile._count?.followers ?? 0, accent: 'bg-cobalt' },
    { tab: 'following', label: 'Seguindo', value: profile._count?.following ?? 0, accent: 'bg-magenta' },
  ];

  return (
    <div className="space-y-5">
      <div className="glass shape-signature-lg overflow-hidden">
        {/* Cover */}
        <div className="relative h-44 overflow-hidden bg-ink/[0.04] sm:h-56 lg:h-72 dark:bg-white/[0.04]">
          {publicProfile?.coverUrl ? (
            <img src={publicProfile.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 50%, #FF5B49 0%, transparent 55%), radial-gradient(circle at 70% 50%, #3D5AFE 0%, transparent 55%)' }} />
            </>
          )}
        </div>

        <div className="px-5 pb-6 pt-4 lg:px-8 lg:pb-8">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
            <div className="lg:flex lg:min-w-0 lg:flex-1 lg:items-end lg:gap-5">
              <div className="-mt-16 inline-flex lg:-mt-24">
                <div
                  className="p-1 bg-surface dark:bg-canvas"
                  style={{ borderRadius: '32px 32px 12px 32px' }}
                >
                  <div className="overflow-hidden" style={{ borderRadius: '28px 28px 8px 28px' }}>
                    <Avatar
                      src={publicProfile?.avatarUrl}
                      name={displayName}
                      size="xl"
                      className="!h-28 !w-28 !rounded-none !ring-0 lg:!h-40 lg:!w-40 lg:!text-5xl"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 min-w-0 space-y-2 lg:mt-0 lg:pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink lg:text-[2.5rem]">
                    {displayName}
                  </h1>
                  {profile.role === 'BUSINESS_OWNER' && (
                    <span className="chip chip-cobalt">
                      <Building2 size={10} />
                      Negócio
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-mute">
                  {username && (
                    <span className="flex items-center gap-1">
                      <AtSign size={11} />
                      {username.replace('@', '')}
                    </span>
                  )}
                  {publicProfile?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {publicProfile.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarDays size={11} />
                    Desde {memberSince}
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
                    {profile.isFollowing ? '✓ Seguindo' : 'Seguir'}
                  </Button>
                  <Button
                    fullWidth
                    variant="glass"
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
              <p className="max-w-3xl text-[15px] leading-relaxed text-ink">
                {publicProfile.bio}
              </p>
            )}

            {profile.company && (
              <Link
                to={`/companies/${profile.company.slug}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-ink/[0.02] px-4 py-3 transition-colors hover:border-cobalt hover:bg-cobalt/[0.05] dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={profile.company.logoUrl} name={profile.company.name} size="md" accent="cobalt" />
                  <div>
                    <p className="flex items-center gap-1 font-display text-sm font-bold text-ink">
                      {profile.company.name}
                      <BadgeCheck size={14} className="fill-cobalt text-surface" />
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                      Empresa vinculada
                    </p>
                  </div>
                </div>
                <Building2 size={16} className="text-cobalt" />
              </Link>
            )}

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {statTabs.map((stat) => (
                <button
                  key={stat.tab}
                  type="button"
                  onClick={() => setActiveTab(stat.tab)}
                  className={`group relative overflow-hidden rounded-2xl border border-line px-4 py-3 text-left transition-all hover:-translate-y-0.5 ${
                    activeTab === stat.tab
                      ? 'bg-ink/[0.04] dark:bg-white/[0.06]'
                      : 'bg-ink/[0.02] dark:bg-white/[0.03]'
                  }`}
                >
                  <span className={`absolute right-3 top-3 h-1.5 w-1.5 rounded-full ${stat.accent}`} />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">{stat.value}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <section className="space-y-4">
        <div className="glass-scrollbar overflow-x-auto">
          <div className="flex min-w-max gap-1 border-b border-line">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
                    isActive ? 'text-ink' : 'text-mute hover:text-ink'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="font-mono text-[10px]">{tab.count}</span>
                  )}
                  {isActive && (
                    <span className={`absolute -bottom-px left-1/2 h-1 w-12 -translate-x-1/2 rounded-t-full ${dotByTab[tab.id]}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'posts' && isLoadingPosts && (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        )}

        {activeTab === 'posts' && !isLoadingPosts && posts.length === 0 && (
          <div className="glass shape-signature px-4 py-12 text-center">
            <UserRound size={28} strokeWidth={1.2} className="mx-auto mb-3 text-mute" />
            <p className="font-display font-bold text-ink">Sem publicações</p>
            <p className="text-sm text-mute">Este perfil ainda não publicou nada.</p>
          </div>
        )}

        {activeTab === 'posts' && posts.length > 0 && (
          <InfiniteList
            items={posts}
            renderItem={(post) => <FeedCard post={post as any} />}
            hasNextPage={!!hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        )}

        {activeTab === 'photos' &&
          (photos.length ? (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {photos.map((media: any) => (
                <Link
                  key={media.id}
                  to={`/feed?post=${media.postId}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-ink/5 dark:bg-white/5"
                >
                  <img
                    src={media.url}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass shape-signature px-4 py-12 text-center">
              <Grid3X3 size={28} strokeWidth={1.2} className="mx-auto mb-3 text-mute" />
              <p className="font-display font-bold text-ink">Sem fotos</p>
            </div>
          ))}

        {activeTab === 'followers' && renderFollowList(followersQuery.data, 'followers')}
        {activeTab === 'following' && renderFollowList(followingQuery.data, 'following')}

        {activeTab === 'about' && (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="glass shape-signature space-y-4 p-5 lg:p-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Sobre {displayName}</h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                  Informações públicas
                </p>
              </div>
              <div className="grid gap-3 text-sm text-ink">
                <p className="flex items-center gap-2">
                  <UserRound size={15} className="text-mute" />
                  {displayName}
                </p>
                {username && (
                  <p className="flex items-center gap-2">
                    <AtSign size={15} className="text-mute" />
                    {username}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <MapPin size={15} className="text-mute" />
                  {publicProfile?.city || 'Cidade não informada'}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-mute" />
                  Membro desde {memberSince}
                </p>
              </div>
              {publicProfile?.bio && (
                <p className="rounded-2xl bg-ink/[0.03] p-4 text-sm leading-6 text-ink dark:bg-white/[0.04]">
                  {publicProfile.bio}
                </p>
              )}
            </div>

            <div className="glass shape-signature space-y-4 p-5 lg:p-6">
              <h2 className="font-display text-lg font-bold text-ink">Resumo</h2>
              <div className="grid grid-cols-2 gap-2">
                {statTabs.map((stat) => (
                  <div
                    key={stat.tab}
                    className="relative rounded-2xl bg-ink/[0.03] p-3 dark:bg-white/[0.04]"
                  >
                    <span className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${stat.accent}`} />
                    <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                      {stat.label}
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-ink">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
