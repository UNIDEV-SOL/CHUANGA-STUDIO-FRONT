import { ChatPage } from "@/components/chat/ChatPage";

export default function AdminChatPage() {
  return (
    <div>
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Comunicação</p>
        <h1 className="font-display text-4xl mt-1">Mensagens</h1>
      </div>
      <ChatPage modo="admin" />
    </div>
  );
}
