/**
 * Error boundary specifically for offline functionality
 */
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class OfflineErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Offline functionality error:', error, errorInfo);
    
    // Don't crash the app for offline errors
    // Just log them and continue
  }

  render() {
    if (this.state.hasError) {
      // Return children anyway - offline errors shouldn't break the app
      console.warn('Offline functionality disabled due to error:', this.state.error);
      return this.props.children;
    }

    return this.props.children;
  }
}