import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  isPermissionError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
    isPermissionError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    let parsedMessage = error.message || 'An unexpected application error occurred.';
    let isPermissionError = false;

    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error) {
        parsedMessage = `${parsed.operationType?.toUpperCase() || 'OPERATION'} on "${parsed.path || 'unknown'}" failed: ${parsed.error}`;
        isPermissionError = parsed.error.toLowerCase().includes('permission') || parsed.error.toLowerCase().includes('insufficient');
      }
    } catch {
      isPermissionError = parsedMessage.toLowerCase().includes('permission');
    }

    return {
      hasError: true,
      errorMessage: parsedMessage,
      isPermissionError,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in MediSupply Connect:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: '', isPermissionError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-slate-900">
                  {this.state.isPermissionError ? 'Access Verification Required' : 'Something went wrong'}
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed break-words">
                  {this.state.errorMessage}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={this.handleReload}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reload Workspace
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
