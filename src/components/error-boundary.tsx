"use client";

import React, { ReactNode, ErrorInfo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logError } from "@/lib/error-logger";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error
    logError("React Error Boundary caught an error", error, {
      componentStack: errorInfo.componentStack,
    });

    console.error("Error Boundary caught:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <Card className="m-4 p-6 bg-red-50 border-red-200">
          <div className="flex gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Upozornenie: Chyba aplikácie
              </h2>
              <p className="text-red-800 mb-4">
                Nanešťastie, sa vyskytla chyba. Pokúste sa prosím načítať stránku znova.
              </p>

              {process.env.NODE_ENV === "development" && (
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer font-mono text-red-700 hover:text-red-900">
                    Detaily chyby
                  </summary>
                  <pre className="mt-2 bg-red-100 p-3 rounded overflow-auto text-xs">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={this.handleReset}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Skúsiť znova
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Načítať stránku
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

