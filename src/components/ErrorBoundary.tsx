import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#fff',
          backgroundColor: '#1a1a2e'
        }}>
          <h2>문제가 발생했습니다.</h2>
          <p>페이지를 새로고침 해주세요.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;