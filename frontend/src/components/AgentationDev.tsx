import { Agentation } from "agentation";

const AGENTATION_ENDPOINT = "http://localhost:4747";

export function AgentationDev() {
  return (
    <Agentation
      endpoint={AGENTATION_ENDPOINT}
      onSessionCreated={(sessionId) => {
        console.log("[Agentation] session:", sessionId);
      }}
    />
  );
}
