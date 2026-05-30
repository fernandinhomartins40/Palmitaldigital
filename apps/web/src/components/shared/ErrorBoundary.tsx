import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="glass shape-signature mx-auto my-12 max-w-md p-8 text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-coral">
              ERRO
            </p>
            <p className="mt-2 font-display text-xl font-bold tracking-tight text-ink">
              Algo deu errado
            </p>
            <p className="mt-1 text-sm text-mute">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="btn-ink mt-5"
            >
              Tentar novamente
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
