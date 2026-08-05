import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Fixora crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7FAFE] px-6">
          <div className="max-w-md text-center">
            <p className="font-display text-xl font-bold text-[#14213D] mb-2">Something went wrong</p>
            <p className="text-sm text-[#6B7280] mb-4">
              Open the browser console (F12) for the exact error — that's the fastest way to get this fixed.
            </p>
            <pre className="text-xs text-left bg-white border border-[#DCE8F7] rounded-lg p-3 overflow-auto text-[#D64541]">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
