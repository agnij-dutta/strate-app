"use client";

import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches synchronous render errors anywhere
 * in the tree and renders a recoverable card with the same editorial
 * styling as the 404 page. Async errors flow through TanStack Query's
 * own error states; this catches the rest.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1400px] flex-col items-start justify-center px-6 py-16 lg:px-10">
        <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-[0.36em] text-ask/85">
          <span>§ ERR</span>
          <span className="block h-px w-32 bg-ask/30" />
          <span className="text-parchment/40">Render failed</span>
        </div>

        <h2
          className="mt-8 font-display font-medium text-parchment"
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
          }}
        >
          Something{" "}
          <span className="italic text-foil-gradient" style={{ fontWeight: 400 }}>
            went sideways.
          </span>
        </h2>

        <p
          className="mt-5 max-w-[60ch] text-[16px] leading-[1.6] text-parchment/65"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          The page hit an unexpected error while rendering. Recovering may
          work; if not, refresh.
        </p>

        <details className="mt-6 max-w-full">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/45 hover:text-foil">
            Technical detail
          </summary>
          <pre className="mt-3 max-w-[80ch] overflow-x-auto border border-parchment/10 bg-ink-deep/60 p-3 font-mono text-[11px] leading-[1.5] text-parchment/70">
            {this.state.error.message}
          </pre>
        </details>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={this.reset}
            className="h-11 bg-foil px-6 font-mono text-[10px] uppercase tracking-[0.28em] text-ink transition-colors hover:bg-foil-deep"
            style={{ borderRadius: 2 }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 border border-parchment/30 px-6 font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/90 transition-colors hover:border-parchment/55"
            style={{ borderRadius: 2 }}
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }
}
