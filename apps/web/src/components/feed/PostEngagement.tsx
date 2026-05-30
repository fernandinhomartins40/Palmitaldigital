import { FormEvent, useMemo, useState } from 'react';
import { PostReactionType } from '@palmital/types';
import { Avatar, Button } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Send, Share2, Sparkles, ThumbsUp, Trash2, Zap } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

type AccentColor = 'coral' | 'citrus' | 'cobalt' | 'magenta' | 'mint';

const reactionLabels: Record<PostReactionType, string> = {
  [PostReactionType.LIKE]: 'Curtir',
  [PostReactionType.LOVE]: 'Amei',
  [PostReactionType.CLAP]: 'Apoiar',
  [PostReactionType.WOW]: 'Uau',
};

const reactionEmojis: Record<PostReactionType, string> = {
  [PostReactionType.LIKE]: '\u{1F44D}',
  [PostReactionType.LOVE]: '\u{1F60D}',
  [PostReactionType.CLAP]: '\u{1F44F}',
  [PostReactionType.WOW]: '\u{1F62E}',
};

const reactionAccent: Record<PostReactionType, AccentColor> = {
  [PostReactionType.LIKE]: 'cobalt',
  [PostReactionType.LOVE]: 'coral',
  [PostReactionType.CLAP]: 'citrus',
  [PostReactionType.WOW]: 'magenta',
};

const emojiReactionTypes = [PostReactionType.LOVE, PostReactionType.CLAP, PostReactionType.WOW];

const accentBg: Record<AccentColor, string> = {
  coral: 'bg-coral',
  citrus: 'bg-citrus',
  cobalt: 'bg-cobalt',
  magenta: 'bg-magenta',
  mint: 'bg-mint',
};

const accentText: Record<AccentColor, string> = {
  coral: 'text-coral',
  citrus: 'text-citrus',
  cobalt: 'text-cobalt',
  magenta: 'text-magenta',
  mint: 'text-mint',
};

const accentHalo: Record<AccentColor, string> = {
  coral: 'halo-coral',
  citrus: 'halo-citrus',
  cobalt: 'halo-cobalt',
  magenta: 'halo-magenta',
  mint: 'halo-mint',
};

function compactCount(value?: number) {
  if (!value || value <= 0) return 0;
  if (value > 999) return `${(value / 1000).toFixed(1)}k`;
  return value;
}

interface PostEngagementProps {
  post: any;
  accent?: AccentColor;
  compact?: boolean;
}

export function PostEngagement({ post, accent = 'coral', compact = false }: PostEngagementProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [showCommentReactionsFor, setShowCommentReactionsFor] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [floatingReaction, setFloatingReaction] = useState<{ id: number; type: PostReactionType } | null>(null);
  const [floatingCommentReaction, setFloatingCommentReaction] = useState<{
    id: number;
    commentId: string;
    type: PostReactionType;
  } | null>(null);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const addToast = useUIStore((state) => state.addToast);

  const counts = post._count ?? {};
  const viewerLiked = Boolean(post.viewerLiked);
  const viewerReaction = post.viewerReaction as PostReactionType | null | undefined;
  const reactionSummary = post.reactionSummary ?? {};
  const emojiReactionSummary = Object.entries(reactionSummary).filter(
    ([type]) => type !== PostReactionType.LIKE,
  );
  const initialComments = useMemo(() => post.comments ?? [], [post.comments]);

  const invalidatePostLists = () => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['user-feed'] });
    queryClient.invalidateQueries({ queryKey: ['company'] });
    queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
  };

  const commentsQuery = useQuery({
    queryKey: ['comments', post.id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${post.id}/comments`);
      return data as any[];
    },
    enabled: isCommentsOpen,
    initialData: initialComments,
  });

  const reactMutation = useMutation({
    mutationFn: (type: PostReactionType) => api.post(`/posts/${post.id}/reactions`, { type }),
    onSuccess: () => {
      setShowReactions(false);
      invalidatePostLists();
    },
    onError: () => addToast('Erro ao registrar reacao', 'error'),
  });

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/likes`),
    onSuccess: () => invalidatePostLists(),
    onError: () => addToast('Erro ao curtir publicacao', 'error'),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/posts/${post.id}/comments`, { content }),
    onSuccess: () => {
      setComment('');
      setIsCommentsOpen(true);
      invalidatePostLists();
    },
    onError: () => addToast('Erro ao comentar', 'error'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.delete(`/posts/${post.id}/comments/${commentId}`),
    onSuccess: () => invalidatePostLists(),
    onError: () => addToast('Erro ao remover comentario', 'error'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      api.post(`/posts/${post.id}/comments/${commentId}/replies`, { content }),
    onSuccess: () => {
      setReplyingToCommentId(null);
      setReplyContent('');
      setIsCommentsOpen(true);
      invalidatePostLists();
    },
    onError: () => addToast('Erro ao responder comentario', 'error'),
  });

  const commentLikeMutation = useMutation({
    mutationFn: (commentId: string) => api.post(`/posts/${post.id}/comments/${commentId}/likes`),
    onSuccess: () => invalidatePostLists(),
    onError: () => addToast('Erro ao curtir comentario', 'error'),
  });

  const commentReactionMutation = useMutation({
    mutationFn: ({ commentId, type }: { commentId: string; type: PostReactionType }) =>
      api.post(`/posts/${post.id}/comments/${commentId}/reactions`, { type }),
    onSuccess: () => {
      setShowCommentReactionsFor(null);
      invalidatePostLists();
    },
    onError: () => addToast('Erro ao reagir ao comentario', 'error'),
  });

  const shareMutation = useMutation({
    mutationFn: (target: string) => api.post(`/posts/${post.id}/shares`, { target }),
    onSuccess: () => invalidatePostLists(),
  });

  const handleSubmitComment = (event: FormEvent) => {
    event.preventDefault();
    const content = comment.trim();
    if (!content) return;
    commentMutation.mutate(content);
  };

  const handleReact = (type: PostReactionType) => {
    setFloatingReaction({ id: Date.now(), type });
    reactMutation.mutate(type);
  };

  const handleCommentReact = (commentId: string, type: PostReactionType) => {
    setFloatingCommentReaction({ id: Date.now(), commentId, type });
    commentReactionMutation.mutate({ commentId, type });
  };

  const handleReplySubmit = (event: FormEvent, commentId: string) => {
    event.preventDefault();
    const content = replyContent.trim();
    if (!content) return;
    replyMutation.mutate({ commentId, content });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/feed?post=${post.id}`;
    const title = post.content?.slice(0, 80) || 'Publicacao no Palmital Digital';
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
        shareMutation.mutate('native');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        addToast('Link copiado', 'success');
        shareMutation.mutate('clipboard');
      }
    } catch {
      addToast('Nao foi possivel compartilhar', 'error');
    }
  };

  const comments = commentsQuery.data ?? initialComments;

  const renderComment = (item: any, depth = 0) => {
    const authorName = item.author?.profile?.displayName ?? 'Usuario';
    const canDelete =
      currentUser?.id === item.authorId ||
      currentUser?.id === post.authorId ||
      currentUser?.role === 'ADMIN';
    const commentCounts = item._count ?? {};
    const commentReactionSummary = Object.entries(item.reactionSummary ?? {}).filter(
      ([type]) => type !== PostReactionType.LIKE,
    );
    const commentReplies = item.replies ?? [];

    return (
      <div key={item.id} className={depth ? 'ml-6 border-l-2 border-line pl-3' : ''}>
        <div className="flex gap-2 rounded-2xl bg-ink/[0.03] p-3 dark:bg-white/[0.03]">
          <Avatar src={item.author?.profile?.avatarUrl} name={authorName} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-sm font-bold text-ink">{authorName}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
              {canDelete ? (
                <button
                  type="button"
                  aria-label="Remover comentario"
                  className="rounded-lg p-1 text-mute hover:bg-coral/10 hover:text-coral"
                  onClick={() => deleteCommentMutation.mutate(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>

            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
              {item.content}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-mute">
              <button
                type="button"
                className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                  item.viewerLiked ? accentText.cobalt : 'hover:text-cobalt'
                }`}
                onClick={() => commentLikeMutation.mutate(item.id)}
                disabled={commentLikeMutation.isPending}
              >
                <ThumbsUp size={12} strokeWidth={item.viewerLiked ? 2.5 : 1.8} />
                {compactCount(commentCounts.likes) || 'Curtir'}
              </button>

              <span className="relative">
                {floatingCommentReaction?.commentId === item.id && (
                  <span
                    key={floatingCommentReaction!.id}
                    className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 animate-[reaction-float_820ms_ease-out_forwards] text-2xl drop-shadow-lg"
                    onAnimationEnd={() => setFloatingCommentReaction(null)}
                    aria-hidden="true"
                  >
                    {reactionEmojis[floatingCommentReaction!.type]}
                  </span>
                )}
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                    item.viewerReaction
                      ? accentText[reactionAccent[item.viewerReaction as PostReactionType]]
                      : 'hover:text-magenta'
                  }`}
                  onClick={() =>
                    setShowCommentReactionsFor((current) => (current === item.id ? null : item.id))
                  }
                >
                  <Sparkles size={12} strokeWidth={item.viewerReaction ? 2.5 : 1.8} />
                  {compactCount(commentCounts.reactions) || 'Reagir'}
                </button>

                {showCommentReactionsFor === item.id && (
                  <div className="glass absolute bottom-6 left-0 z-20 flex items-center gap-1 rounded-2xl p-1.5">
                    {emojiReactionTypes.map((type) => {
                      const tone = reactionAccent[type];
                      const isSelected = item.viewerReaction === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          aria-label={reactionLabels[type]}
                          title={reactionLabels[type]}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition-all hover:-translate-y-1 hover:scale-125 ${
                            isSelected ? `halo ${accentHalo[tone]} ${accentBg[tone]}` : ''
                          }`}
                          onClick={() => handleCommentReact(item.id, type)}
                        >
                          <span aria-hidden="true">{reactionEmojis[type]}</span>
                        </button>
                      );
                    })}
                    {item.viewerReaction && (
                      <button
                        type="button"
                        className="ml-1 rounded-xl px-3 py-2 text-xs font-bold text-coral hover:bg-coral/10"
                        onClick={() =>
                          commentReactionMutation.mutate({
                            commentId: item.id,
                            type: item.viewerReaction as PostReactionType,
                          })
                        }
                      >
                        Remover
                      </button>
                    )}
                  </div>
                )}
              </span>

              <button
                type="button"
                className="font-semibold hover:text-ink"
                onClick={() => {
                  setReplyingToCommentId((current) => (current === item.id ? null : item.id));
                  setReplyContent('');
                }}
              >
                Responder
              </button>

              {commentReactionSummary.map(([type, count]) => (
                <span
                  key={type}
                  className="chip"
                  title={reactionLabels[type as PostReactionType]}
                >
                  <span aria-hidden="true">{reactionEmojis[type as PostReactionType]}</span>
                  <span className="font-mono">{count as number}</span>
                </span>
              ))}
            </div>

            {replyingToCommentId === item.id && (
              <form onSubmit={(event) => handleReplySubmit(event, item.id)} className="mt-3 flex items-end gap-2">
                <textarea
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder={`Responder ${authorName}...`}
                  className="min-h-[2.5rem] flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                />
                <Button type="submit" size="sm" disabled={!replyContent.trim()} isLoading={replyMutation.isPending}>
                  <Send size={15} />
                </Button>
              </form>
            )}
          </div>
        </div>

        {commentReplies.length > 0 && (
          <div className="mt-2 space-y-2">
            {commentReplies.map((reply: any) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const counterClass = 'font-mono text-[10px] uppercase tracking-wider text-mute';

  return (
    <div className={compact ? 'space-y-3' : 'mt-4 space-y-3 border-t border-line pt-3'}>
      {/* contadores compactos */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`flex flex-wrap items-center gap-3 ${counterClass}`}>
            <span>{compactCount(counts.likes)} curtidas</span>
            <span>•</span>
            <span>{compactCount(counts.reactions)} reações</span>
            <span>•</span>
            <span>{compactCount(counts.comments)} comentários</span>
          </div>

          {emojiReactionSummary.length > 0 && (
            <div className="flex items-center gap-1">
              {emojiReactionSummary.map(([type, count]) => (
                <span
                  key={type}
                  className="chip"
                  title={reactionLabels[type as PostReactionType]}
                >
                  <span aria-hidden="true">{reactionEmojis[type as PostReactionType]}</span>
                  <span className="font-mono">{count as number}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* botões de ação */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          type="button"
          disabled={likeMutation.isPending}
          onClick={() => likeMutation.mutate()}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
            viewerLiked
              ? `halo halo-cobalt bg-cobalt text-white`
              : 'bg-ink/[0.04] text-ink hover:bg-ink/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]'
          }`}
        >
          <ThumbsUp size={14} strokeWidth={viewerLiked ? 2.5 : 1.9} />
          <span className="hidden sm:inline">Curtir</span>
        </button>

        <div className="relative">
          {floatingReaction && (
            <span
              key={floatingReaction.id}
              className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 animate-[reaction-float_820ms_ease-out_forwards] text-3xl drop-shadow-lg"
              onAnimationEnd={() => setFloatingReaction(null)}
              aria-hidden="true"
            >
              {reactionEmojis[floatingReaction.type]}
            </span>
          )}

          <button
            type="button"
            disabled={reactMutation.isPending}
            onClick={() => setShowReactions((value) => !value)}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              viewerReaction
                ? `halo ${accentHalo[reactionAccent[viewerReaction]]} ${accentBg[reactionAccent[viewerReaction]]} text-white`
                : 'bg-ink/[0.04] text-ink hover:bg-ink/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]'
            }`}
          >
            {viewerReaction ? (
              <span className="text-base leading-none" aria-hidden="true">
                {reactionEmojis[viewerReaction]}
              </span>
            ) : (
              <Heart size={14} strokeWidth={1.9} />
            )}
            <span className="hidden sm:inline">
              {viewerReaction ? reactionLabels[viewerReaction] : 'Reagir'}
            </span>
          </button>

          {showReactions && (
            <div className="glass absolute bottom-12 left-0 z-20 flex items-center gap-1 rounded-2xl p-1.5">
              {emojiReactionTypes.map((type) => {
                const tone = reactionAccent[type];
                const isSelected = viewerReaction === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-label={reactionLabels[type]}
                    title={reactionLabels[type]}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-2xl transition-all hover:-translate-y-1 hover:scale-125 ${
                      isSelected ? `halo ${accentHalo[tone]} ${accentBg[tone]}` : 'hover:bg-ink/5'
                    }`}
                    onClick={() => handleReact(type)}
                  >
                    <span aria-hidden="true">{reactionEmojis[type]}</span>
                  </button>
                );
              })}
              {viewerReaction && (
                <button
                  type="button"
                  className="ml-1 rounded-xl px-3 py-2 text-xs font-bold text-coral hover:bg-coral/10"
                  onClick={() => reactMutation.mutate(viewerReaction)}
                >
                  Remover
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsCommentsOpen((value) => !value)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-ink/[0.04] py-2.5 text-xs font-semibold text-ink transition-all hover:bg-ink/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
        >
          <MessageCircle size={14} strokeWidth={1.9} />
          <span className="hidden sm:inline">Comentar</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-ink/[0.04] py-2.5 text-xs font-semibold text-ink transition-all hover:bg-ink/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
        >
          <Share2 size={14} strokeWidth={1.9} />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </div>

      {compact && (counts.likes > 0 || counts.reactions > 0 || counts.comments > 0) && (
        <div className={`flex items-center gap-3 ${counterClass}`}>
          <span>
            <Zap size={10} className={`inline ${accentText[accent]}`} />{' '}
            {compactCount(counts.likes)} • {compactCount(counts.reactions)} •{' '}
            {compactCount(counts.comments)}
          </span>
        </div>
      )}

      {isCommentsOpen && (
        <div className="space-y-3">
          <form onSubmit={handleSubmitComment} className="flex items-end gap-2">
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Adicione um comentário..."
              className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-line bg-ink/[0.02] px-3 py-2 text-sm text-ink outline-none focus:border-coral focus:bg-surface focus:ring-2 focus:ring-coral/20 dark:bg-white/[0.03]"
            />
            <Button type="submit" size="sm" disabled={!comment.trim()} isLoading={commentMutation.isPending}>
              <Send size={15} />
            </Button>
          </form>

          <div className="space-y-2">
            {comments.map((item: any) => renderComment(item))}
            {!comments.length && (
              <div className="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-sm text-mute">
                Seja o primeiro a comentar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
