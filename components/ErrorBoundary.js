// components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-50 text-red-700 rounded">
                    <h2>Something went wrong.</h2>
                    <details className="mt-2">
                        <summary>Error details</summary>
                        <pre className="mt-2 text-xs">{this.state.error.toString()}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
