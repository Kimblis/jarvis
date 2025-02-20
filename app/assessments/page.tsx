import { ChatWindow } from "@/components/assessment/ChatWindow";
import { AssessmentProvider } from "@/context/AssessmentContext";

export default function AssessmentsPage() {
  return (
    <AssessmentProvider>
      <ChatWindow endpoint="api/chat/assessment" />
    </AssessmentProvider>
  );
}
