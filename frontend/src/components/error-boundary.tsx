"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Algo salió mal
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
