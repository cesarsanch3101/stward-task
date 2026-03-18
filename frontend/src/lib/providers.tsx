"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={(resolvedTheme as "light" | "dark") ?? "light"}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "dark:!bg-[#1a1030] dark:!border-white/10 dark:!text-white dark:!rounded-2xl",
          description: "dark:!text-white/60",
          actionButton: "dark:!bg-indigo-500/20 dark:!text-indigo-300",
          cancelButton: "dark:!bg-white/10 dark:!text-white/60",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30s
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
