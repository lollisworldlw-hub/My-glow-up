import { Component, type ReactNode } from 'react';

/** Shows a friendly message instead of a blank screen if something breaks. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidUpdate(prev: { resetKey?: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  componentDidCatch(error: Error) { console.error('Screen error', error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card p-3.5 mt-3 text-center">
        <div className="text-[18px] text-rose">♡</div>
        <div className="h-serif text-[15px]">Something went wrong here</div>
        <p className="text-[13px] text-muted mt-1">Your data is safe. Try reloading — if it keeps happening, let Shauna know.</p>
        <p className="text-[12px] text-muted mt-2 break-words">{String(this.state.error?.message ?? '')}</p>
        <button className="btn-primary btn-sm mt-3" onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}
