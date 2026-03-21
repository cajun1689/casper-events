import { Component, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
          <p className="mb-4 text-5xl">😕</p>
          <h1 className="mb-2 text-xl font-extrabold text-gray-900">Something went wrong</h1>
          <p className="mb-6 max-w-md text-gray-600">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-700"
          >
            <RefreshCw className="h-4 w-4" />
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
