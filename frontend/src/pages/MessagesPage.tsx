import { useParams } from "react-router-dom";
import { InboxView } from "@/components/messages/InboxView";
import { ThreadView } from "@/components/messages/ThreadView";

export function MessagesPage() {
  const { conversationId } = useParams();

  return (
    <section className="messages-page relative left-1/2 -my-6 w-screen -translate-x-1/2 lg:grid lg:h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_clamp(22rem,32vw,53.5rem)]">
      <InboxView className={conversationId ? "hidden lg:col-start-2 lg:row-start-1 lg:block" : "lg:col-start-2 lg:row-start-1"} />
      <div
        className={
          conversationId
            ? "min-w-0 lg:col-start-1 lg:row-start-1 lg:min-h-0"
            : "hidden min-w-0 lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-0 lg:items-center lg:justify-center"
        }
      >
        {conversationId ? (
          <ThreadView conversationId={conversationId} embedded />
        ) : (
          <p className="text-sm text-muted-foreground">Select a conversation to start messaging.</p>
        )}
      </div>
    </section>
  );
}
