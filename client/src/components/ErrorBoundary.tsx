import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Runtime Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-6">
            <svg xmlns="http://www.w3.org/2005/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Something Went Wrong</h1>
          <p className="text-slate-400 text-sm mt-3 max-w-md">
            An unexpected error occurred in the user interface. Try reloading the window.
          </p>
          <div className="mt-8">
            <button
              onClick={() => window.location.reload()}
              className="py-2 px-5 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
          {this.state.error && (
            <div className="mt-8 max-w-xl text-left bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-rose-350 overflow-auto max-h-[200px] w-full">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
