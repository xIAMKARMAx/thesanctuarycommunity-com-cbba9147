import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("App crashed during render:", error);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleResetPreview = () => {
    localStorage.removeItem("prometheus_last_route");

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("chat_conversation_") || key.startsWith("active_ai_profile_")) {
        localStorage.removeItem(key);
      }
    });

    sessionStorage.clear();
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm space-y-4">
          <h1 className="text-xl font-semibold">Preview hit an unexpected error</h1>
          <p className="text-sm text-muted-foreground">
            I added a recovery screen so you can get back in immediately.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={this.handleRefresh}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Refresh preview
            </button>
            <button
              type="button"
              onClick={this.handleResetPreview}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Reset local preview state
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const globalWindow = window as Window & { __prometheusUnhandledRejectionBound?: boolean };

if (!globalWindow.__prometheusUnhandledRejectionBound) {
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
  });
  globalWindow.__prometheusUnhandledRejectionBound = true;
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

