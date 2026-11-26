import { ChatPage } from "@/modules/chat/components/ChatPage";
import { usePaginaTitulo } from "@/shared/lib/seo";

export default function ClientChatPage() {
  usePaginaTitulo("Mensagens", { indexar: false });
  return (
    <section className="py-10 gradient-hero min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-deep font-medium">Minha área</p>
          <h1 className="font-display text-4xl mt-1">Mensagens</h1>
          <p className="text-sm text-muted-foreground mt-1">Fale com a equipa do estúdio ou com outras clientes na Comunidade Chuanga.</p>
        </div>
        <ChatPage modo="cliente" />
      </div>
    </section>
  );
}
