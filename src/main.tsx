import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
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
    sessionStorage.clear();
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#f5f5f5" }}>
        <div style={{ maxWidth: 400, padding: 24, background: "#fff", borderRadius: 12, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>The app hit an error. Try refreshing.</p>
          <button onClick={this.handleRefresh} style={{ width: "100%", padding: "10px 16px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, marginBottom: 8 }}>
            Refresh
          </button>
          <button onClick={this.handleResetPreview} style={{ width: "100%", padding: "10px 16px", background: "#fff", color: "#333", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            Reset &amp; refresh
          </button>
        </div>
      </div>
    );
  }
}

const root = createRoot(document.getElementById("root")!);

const renderApp = () => {
  root.render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
};

const isPreviewHost =
  window.location.hostname.startsWith("id-preview--") || window.location.hostname.includes("lovableproject.com");
const shouldResetToLanding =
  isPreviewHost &&
  window.location.pathname === "/welcome" &&
  !sessionStorage.getItem("prometheus_preview_landing_reset_done");

const bootstrap = async () => {
  if (shouldResetToLanding) {
    sessionStorage.setItem("prometheus_preview_landing_reset_done", "true");
    localStorage.removeItem("prometheus_last_route");

    window.location.replace("/");
    return;
  }

  renderApp();
};

void bootstrap();
