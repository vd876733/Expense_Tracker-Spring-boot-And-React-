import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-6">
          <div className="max-w-xl w-full bg-white shadow-xl rounded-3xl p-10 text-center border border-red-200">
            <h1 className="text-4xl font-extrabold text-red-700 mb-4">Oops!</h1>
            <p className="text-lg text-gray-700 mb-6">Something went wrong. Please try reloading the page.</p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-red-600 text-white rounded-full font-semibold shadow-lg hover:bg-red-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
