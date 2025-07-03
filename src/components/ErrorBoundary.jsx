import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
          <div className="mx-auto max-w-max">
            <main className="sm:flex">
              <div className="text-center sm:text-left">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Something went wrong
                </h1>
                <p className="mt-4 text-base text-gray-500">
                  An unexpected error occurred. Please refresh the page to try again.
                </p>
                <div className="mt-10">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;