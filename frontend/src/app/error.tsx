"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ChunkLoadError ocurre cuando el browser tiene cacheados JS bundles de un
    // deploy anterior y los chunks que referencian ya no existen en el servidor.
    // La solución es recargar la página para obtener los chunks actuales.
    if (error.name === "ChunkLoadError") {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        <h2 className="text-xl font-semibold text-foreground">
          Algo salió mal
        </h2>
        <p className="text-sm text-muted-foreground">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <Button onClick={reset} variant="outline">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
