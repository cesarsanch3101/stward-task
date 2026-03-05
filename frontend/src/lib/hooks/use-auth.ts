"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as api from "@/lib/api";
import { setTokens, clearTokens, isAuthenticated } from "@/lib/auth";
import { workspaceKeys } from "./use-workspaces";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: api.getMe,
    enabled: typeof window !== "undefined" && isAuthenticated(),
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.login,
    onSuccess: async (tokens) => {
      setTokens(tokens);
      // Pre-warm workspaces cache so sidebar renders instantly (no loading flash)
      await queryClient.prefetchQuery({
        queryKey: workspaceKeys.all,
        queryFn: api.getWorkspaces,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      router.push("/");
    },
    onError: (err: Error) => {
      let message = "Error al iniciar sesión";
      try {
        const parsed = JSON.parse(err.message.replace(/^API \d+: /, ""));
        message = parsed.detail || message;
      } catch {
        if (err.message.includes("401")) message = "Credenciales incorrectas";
      }
      toast.error(message);
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.register,
    onSuccess: async (tokens) => {
      setTokens(tokens);
      await queryClient.prefetchQuery({
        queryKey: workspaceKeys.all,
        queryFn: api.getWorkspaces,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      router.push("/");
      toast.success("Cuenta creada exitosamente");
    },
    onError: (err: Error) => {
      let message = "Error al crear cuenta";
      try {
        const parsed = JSON.parse(err.message.replace(/^API \d+: /, ""));
        message = parsed.detail || message;
      } catch {
        // keep default
      }
      toast.error(message);
    },
  });
}

export function useGoogleAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idToken: string) => api.googleAuth(idToken),
    onSuccess: async (tokens) => {
      setTokens(tokens);
      await queryClient.prefetchQuery({
        queryKey: workspaceKeys.all,
        queryFn: api.getWorkspaces,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      router.push("/");
    },
    onError: (err: Error) => {
      let message = "Error al iniciar sesión con Google";
      try {
        const parsed = JSON.parse(err.message.replace(/^API \d+: /, ""));
        message = parsed.detail || message;
      } catch {
        if (err.message.includes("403")) message = "Sin acceso. Contacta al administrador.";
      }
      toast.error(message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    clearTokens();
    queryClient.clear();
    router.push("/login");
  };
}
