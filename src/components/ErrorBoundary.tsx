import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ padding: 24, margin: 20, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            Couldn&apos;t load {this.props.label ?? 'this section'}.
          </div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
            Something went wrong loading this data. Try again.
          </div>
          <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
