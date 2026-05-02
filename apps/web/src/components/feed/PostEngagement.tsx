import { FormEvent, useMemo, useState } from 'react';
import { PostReactionType } from '@palmital/types';
import { Avatar, Button } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Send, Share2, SmilePlus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

const reactionLabels: Record<PostReactionType, string> = {
  [PostReactionType.LIKE]: 'Curtir',
  [PostReactionType.LOVE]: 'Amei',
  [PostReactionType.CLAP]: 'Apoiar',
  [PostReactionType.WOW]: 'Uau',
};

function compactCount(value?: number) {
  return value && value > 0 ? value : 0;
}

export function PostEngagement({ post }: { post: any }) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const addToast = useUIStore((state) => state.addToast);

  const counts = post._count ?? {};
  const viewerReaction = post.viewerReaction as PostReactionType | null | undefined;
  const reactionSummary = post.reactionSummary ?? {};
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

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span>{compactCount(counts.reactions)} curtida(s)</span>
          <span>{compactCount(counts.comments)} comentario(s)</span>
          <span>{compactCount(counts.shares)} compartilhamento(s)</span>
        </div>

        {Object.entries(reactionSummary).length ? (
          <div className="flex items-center gap-1.5">
            {Object.entries(reactionSummary).map(([type, count]) => (
              <span key={type} className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                {reactionLabels[type as PostReactionType]} {count as number}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="relative">
          <Button
            type="button"
            variant={viewerReaction ? 'primary' : 'secondary'}
            size="sm"
            fullWidth
            disabled={reactMutation.isPending}
            onClick={() => setShowReactions((value) => !value)}
          >
            <Heart size={15} />
            <span className="ml-1.5">
              {viewerReaction ? reactionLabels[viewerReaction] : 'Curtir'}
            </span>
          </Button>

          {showReactions ? (
            <div className="absolute bottom-11 left-0 z-20 grid w-44 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
              {Object.values(PostReactionType).map((type) => (
                <button
                  key={type}
                  type="button"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => reactMutation.mutate(type)}
                >
                  <SmilePlus size={15} className="text-blue-600" />
                  {reactionLabels[type]}
                </button>
              ))}
              {viewerReaction ? (
                <button
                  type="button"
                  className="rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  onClick={() => reactMutation.mutate(viewerReaction)}
                >
                  Remover reacao
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
            {comments.map((item: any) => {
              const authorName = item.author?.profile?.displayName ?? 'Usuario';
              const canDelete =
                currentUser?.id === item.authorId ||
                currentUser?.id === post.authorId ||
                currentUser?.role === 'ADMIN';

              return (
                <div key={item.id} className="flex gap-2 rounded-2xl bg-slate-50 p-3">
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
                        <p className="text-xs text-slate-400">
                          {formatRelativeTime(item.createdAt)}
                        </p>
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
                  </div>
                </div>
              );
            })}

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
