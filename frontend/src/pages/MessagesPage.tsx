import { useParams } from "react-router-dom";
import { InboxView } from "@/components/messages/InboxView";
import { ThreadView } from "@/components/messages/ThreadView";

export function MessagesPage() {
  const { conversationId } = useParams();
  return conversationId ? <ThreadView conversationId={conversationId} /> : <InboxView />;
}
