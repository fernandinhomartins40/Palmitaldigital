import { FormEvent, useMemo, useState } from 'react';
import { PostReactionType } from '@palmital/types';
import { Avatar, Button } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Share2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

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

const emojiReactionTypes = [
  PostReactionType.LOVE,
  PostReactionType.CLAP,
  PostReactionType.WOW,
];

function compactCount(value?: number) {
  return value && value > 0 ? value : 0;
}

export function PostEngagement({ post }: { post: any }) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [showCommentReactionsFor, setShowCommentReactionsFor] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [floatingReaction, setFloatingReaction] = useState<{
    id: number;
    type: PostReactionType;
  } | null>(null);
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
      <div key={item.id} className={depth ? 'ml-7 border-l border-slate-200 pl-3' : ''}>
        <div className="flex gap-2 rounded-2xl bg-slate-50 p-3">
          <Avatar
            src={item.author?.profile?.avatarUrl}
            name={authorName}
            size="sm"
            className="h-8 w-8"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{authorName}</p>
                <p className="text-xs text-slate-400">{formatRelativeTime(item.createdAt)}</p>
              </div>
              {canDelete ? (
                <button
                  type="button"
                  aria-label="Remover comentario"
                  className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-red-600"
                  onClick={() => deleteCommentMutation.mutate(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>

            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
              {item.content}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                className={`font-semibold hover:text-blue-600 ${item.viewerLiked ? 'text-blue-600' : ''}`}
                onClick={() => commentLikeMutation.mutate(item.id)}
                disabled={commentLikeMutation.isPending}
              >
                {reactionEmojis[PostReactionType.LIKE]} Curtir
              </button>

              <span>{compactCount(commentCounts.likes)} curtida(s)</span>

              <span className="relative">
                {floatingCommentReaction?.commentId === item.id ? (
                  <span
                    key={floatingCommentReaction!.id}
                    className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 animate-[reaction-float_820ms_ease-out_forwards] text-2xl drop-shadow-lg"
                    onAnimationEnd={() => setFloatingCommentReaction(null)}
                    aria-hidden="true"
                  >
                    {reactionEmojis[floatingCommentReaction!.type]}
                  </span>
                ) : null}
                <button
                  type="button"
                  className={`font-semibold hover:text-blue-600 ${item.viewerReaction ? 'text-blue-600' : ''}`}
                  onClick={() =>
                    setShowCommentReactionsFor((current) => (current === item.id ? null : item.id))
                  }
                >
                  {item.viewerReaction ? reactionEmojis[item.viewerReaction as PostReactionType] : '\u{1F642}'}{' '}
                  Reagir
                </button>

                {showCommentReactionsFor === item.id ? (
                  <span className="absolute bottom-6 left-0 z-20 flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-lg">
                    {emojiReactionTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        aria-label={reactionLabels[type]}
                        title={reactionLabels[type]}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xl transition duration-150 hover:-translate-y-1 hover:scale-125 hover:bg-slate-50 ${
                          item.viewerReaction === type ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                        }`}
                        onClick={() => handleCommentReact(item.id, type)}
                      >
                        <span aria-hidden="true">{reactionEmojis[type]}</span>
                      </button>
                    ))}
                    {item.viewerReaction ? (
                      <button
                        type="button"
                        className="ml-1 rounded-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={() =>
                          commentReactionMutation.mutate({
                            commentId: item.id,
                            type: item.viewerReaction as PostReactionType,
                          })
                        }
                      >
                        Remover
                      </button>
                    ) : null}
                  </span>
                ) : null}
              </span>

              <span>{compactCount(commentCounts.reactions)} reacao(oes)</span>

              <button
                type="button"
                className="font-semibold hover:text-blue-600"
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
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-medium"
                  title={reactionLabels[type as PostReactionType]}
                >
                  <span aria-hidden="true">{reactionEmojis[type as PostReactionType]}</span>
                  <span>{count as number}</span>
                </span>
              ))}
            </div>

            {replyingToCommentId === item.id ? (
              <form onSubmit={(event) => handleReplySubmit(event, item.id)} className="mt-3 flex items-end gap-2">
                <textarea
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder={`Responder ${authorName}...`}
                  className="min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim()}
                  isLoading={replyMutation.isPending}
                >
                  <Send size={15} />
                </Button>
              </form>
            ) : null}
          </div>
        </div>

        {commentReplies.length ? (
          <div className="mt-2 space-y-2">
            {commentReplies.map((reply: any) => renderComment(reply, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span>{compactCount(counts.likes)} curtida(s)</span>
          <span>{compactCount(counts.reactions)} reacao(oes)</span>
          <span>{compactCount(counts.comments)} comentario(s)</span>
          <span>{compactCount(counts.shares)} compartilhamento(s)</span>
        </div>

        {emojiReactionSummary.length ? (
          <div className="flex items-center gap-1.5">
            {emojiReactionSummary.map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium"
                title={reactionLabels[type as PostReactionType]}
              >
                <span aria-hidden="true">{reactionEmojis[type as PostReactionType]}</span>
                <span>{count as number}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button
          type="button"
          variant={viewerLiked ? 'primary' : 'secondary'}
          size="sm"
          fullWidth
          disabled={likeMutation.isPending}
          onClick={() => likeMutation.mutate()}
        >
          <span className="text-base leading-none" aria-hidden="true">
            {reactionEmojis[PostReactionType.LIKE]}
          </span>
          <span className="ml-1.5 truncate">Curtir</span>
        </Button>

        <div className="relative">
          {floatingReaction ? (
            <span
              key={floatingReaction.id}
              className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 animate-[reaction-float_820ms_ease-out_forwards] text-3xl drop-shadow-lg"
              onAnimationEnd={() => setFloatingReaction(null)}
              aria-hidden="true"
            >
              {reactionEmojis[floatingReaction.type]}
            </span>
          ) : null}

          <Button
            type="button"
            variant={viewerReaction ? 'primary' : 'secondary'}
            size="sm"
            fullWidth
            disabled={reactMutation.isPending}
            onClick={() => setShowReactions((value) => !value)}
          >
            <span className="text-base leading-none" aria-hidden="true">
              {viewerReaction ? reactionEmojis[viewerReaction] : '\u{1F642}'}
            </span>
            <span className="ml-1.5 truncate">
              {viewerReaction ? reactionLabels[viewerReaction] : 'Reagir'}
            </span>
          </Button>

          {showReactions ? (
            <div className="absolute bottom-11 left-0 z-20 flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-lg">
              {emojiReactionTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-label={reactionLabels[type]}
                  title={reactionLabels[type]}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-2xl transition duration-150 hover:-translate-y-1 hover:scale-125 hover:bg-slate-50 ${
                    viewerReaction === type ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                  }`}
                  onClick={() => handleReact(type)}
                >
                  <span aria-hidden="true">{reactionEmojis[type]}</span>
                </button>
              ))}
              {viewerReaction ? (
                <button
                  type="button"
                  className="ml-1 rounded-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  onClick={() => reactMutation.mutate(viewerReaction)}
                >
                  Remover
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => setIsCommentsOpen((value) => !value)}
        >
          <MessageCircle size={15} />
          <span className="ml-1.5">Comentar</span>
        </Button>

        <Button type="button" variant="secondary" size="sm" fullWidth onClick={handleShare}>
          <Share2 size={15} />
          <span className="ml-1.5">Compartilhar</span>
        </Button>
      </div>

      {isCommentsOpen ? (
        <div className="mt-4 space-y-3">
          <form onSubmit={handleSubmitComment} className="flex items-end gap-2">
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Escreva um comentario..."
              className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!comment.trim()}
              isLoading={commentMutation.isPending}
            >
              <Send size={15} />
            </Button>
          </form>

          <div className="space-y-2">
            {comments.map((item: any) => renderComment(item))}

            {!comments.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                Nenhum comentario ainda.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
