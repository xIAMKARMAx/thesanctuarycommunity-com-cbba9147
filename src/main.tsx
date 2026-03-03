import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

interface AppErrorBoundaryState {
  hasError: boolean;
}

const clearPreviewState = () => {
  localStorage.removeItem("prometheus_last_route");

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("chat_conversation_") || key.startsWith("active_ai_profile_")) {
      localStorage.removeItem(key);
    }
  });

  sessionStorage.clear();
};

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
    clearPreviewState();
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

function FatalBootstrapScreen() {
  const handleReset = () => {
    clearPreviewState();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm space-y-4">
        <h1 className="text-xl font-semibold">Preview failed to load modules</h1>
        <p className="text-sm text-muted-foreground">
          A temporary module/network failure occurred. You can retry without losing your work.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retry loading preview
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Reset local preview state
          </button>
        </div>
      </div>
    </div>
  );
}

function BootstrapLoadingScreen({ attempt, maxAttempts }: { attempt: number; maxAttempts: number }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <h1 className="text-xl font-semibold">Loading preview</h1>
        <p className="text-sm text-muted-foreground">
          Initializing app modules{maxAttempts > 1 ? ` (attempt ${attempt}/${maxAttempts})` : ""}…
        </p>
      </div>
    </div>
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadAppWithRetry(
  maxAttempts = 4,
  onAttempt?: (attempt: number, maxAttempts: number) => void
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    onAttempt?.(attempt, maxAttempts);

    try {
      const module = await import("./App.tsx");
      return module.default;
    } catch (error) {
      lastError = error;
      console.error(`Failed to load App module (attempt ${attempt}/${maxAttempts}):`, error);

      if (attempt < maxAttempts) {
        await sleep(500 * attempt);
      }
    }
  }

  throw lastError;
}

const globalWindow = window as Window & { __prometheusUnhandledRejectionBound?: boolean };

if (!globalWindow.__prometheusUnhandledRejectionBound) {
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
  });
  globalWindow.__prometheusUnhandledRejectionBound = true;
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

async function bootstrap() {
  const maxAttempts = 4;

  try {
    const App = await loadAppWithRetry(maxAttempts, (attempt, attempts) => {
      root.render(<BootstrapLoadingScreen attempt={attempt} maxAttempts={attempts} />);
    });

    root.render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    );
  } catch (error) {
    console.error("App bootstrap failed:", error);
    root.render(<FatalBootstrapScreen />);
  }
}

void bootstrap();

