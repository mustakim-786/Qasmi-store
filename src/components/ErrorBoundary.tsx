import { Component, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { reportError } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    reportError(error, { source: 'react-error-boundary' });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-ink">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted">
            An unexpected error occurred. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-6"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
