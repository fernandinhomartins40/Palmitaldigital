import { MessageCircle } from 'lucide-react';
import { ChatSidebar } from '../../components/chat/ChatSidebar';

export function ConversationsPage() {
  return (
    <div className="px-4 pb-6 lg:px-0">
      <div className="lg:grid lg:grid-cols-[360px,minmax(0,1fr)] lg:gap-6">
        <ChatSidebar />

        <div className="hidden min-h-[calc(100vh-9rem)] items-center justify-center rounded-[32px] border border-white/70 bg-white/80 p-8 text-center shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:flex">
          <div className="max-w-sm text-gray-500">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <MessageCircle size={28} />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-gray-900">Selecione uma conversa</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Busque usuários cadastrados pelo nome para iniciar um novo atendimento ou continue uma conversa existente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
