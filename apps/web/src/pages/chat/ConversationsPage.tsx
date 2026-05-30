import { MessageCircle, Send } from 'lucide-react';
import { ChatSidebar } from '../../components/chat/ChatSidebar';

export function ConversationsPage() {
  return (
    <div className="lg:grid lg:grid-cols-[360px,minmax(0,1fr)] lg:gap-6">
      <ChatSidebar />

      <div className="glass shape-signature-lg hidden min-h-[calc(100vh-9rem)] items-center justify-center p-8 text-center lg:flex">
        <div className="max-w-sm">
          <div className="halo halo-cobalt mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cobalt text-white">
            <MessageCircle size={28} strokeWidth={2} />
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink">
            Selecione uma conversa
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Busque alguém pelo nome na lista ao lado para iniciar um atendimento, ou continue uma
            conversa existente.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wider text-mute">
            <Send size={11} />
            Mensagens em tempo real
          </div>
        </div>
      </div>
    </div>
  );
}
