import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import { initPwa } from "./lib/pwa";
import "./index.css";

// Registers the service worker and starts listening for install/update events.
initPwa();

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace" }}>
          <h2 style={{ color: "red" }}>App crashed</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{(this.state.error as Error).message}</pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#666" }}>{(this.state.error as Error).stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
