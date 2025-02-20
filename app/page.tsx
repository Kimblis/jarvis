import { ChatWindow } from "@/components/ChatWindow";
import { EmptyView } from "@/components/EmptyView";

export default function AgentsPage() {
  return (
    <ChatWindow
      endpoint="api/chat/retrieval"
      emptyStateComponent={<EmptyView />}
      placeholder={"Kas yra nepriklausomi įvykiai?"}
    />
  );
}
