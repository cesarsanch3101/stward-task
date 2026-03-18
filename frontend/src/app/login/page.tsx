"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";

const GoogleAuthButton = dynamic(
  () => import("@/components/auth/google-auth-button").then((m) => m.GoogleAuthButton),
  { ssr: false, loading: () => <div className="h-10 w-[368px] rounded bg-muted animate-pulse" /> }
);
import { useLogin, useRegister, useGoogleAuth } from "@/lib/hooks/use-auth";
import {
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from "@/lib/schemas";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const googleAuthMutation = useGoogleAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", first_name: "", last_name: "" },
  });

  const isPending = isRegister
    ? registerMutation.isPending
    : loginMutation.isPending;

  function handleLoginSubmit(data: LoginFormData) {
    loginMutation.mutate(data);
  }

  function handleRegisterSubmit(data: RegisterFormData) {
    registerMutation.mutate(data);
  }

  const activeErrors = isRegister
    ? registerForm.formState.errors
    : loginForm.formState.errors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] shadow-[0_25px_50px_rgba(0,0,0,0.5)] p-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <Image
            src="/logo-stward.png"
            alt="Stward Corporation"
            width={180}
            height={48}
            className="invert brightness-200"
            priority
          />
          <p className="text-white/40 text-xs tracking-widest uppercase">
            Gestión de proyectos
          </p>
        </div>

        {/* Title */}
        <h1 className="text-white text-2xl font-bold text-center mb-6">
          {isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </h1>

        <form
          onSubmit={
            isRegister
              ? registerForm.handleSubmit(handleRegisterSubmit)
              : loginForm.handleSubmit(handleLoginSubmit)
          }
          className="space-y-4"
        >
          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-xs font-semibold uppercase tracking-widest text-white/50"
                >
                  Nombre
                </Label>
                <Input
                  id="firstName"
                  {...registerForm.register("first_name")}
                  placeholder="Juan"
                  autoComplete="given-name"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/50 focus:ring-indigo-400/20 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-xs font-semibold uppercase tracking-widest text-white/50"
                >
                  Apellido
                </Label>
                <Input
                  id="lastName"
                  {...registerForm.register("last_name")}
                  placeholder="Pérez"
                  autoComplete="family-name"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/50 focus:ring-indigo-400/20 rounded-xl"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-widest text-white/50"
            >
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              {...(isRegister
                ? registerForm.register("email")
                : loginForm.register("email"))}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              autoFocus
              className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/50 focus:ring-indigo-400/20 rounded-xl"
            />
            {activeErrors.email && (
              <p className="text-xs text-red-400">
                {activeErrors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-widest text-white/50"
            >
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              {...(isRegister
                ? registerForm.register("password")
                : loginForm.register("password"))}
              placeholder="Mínimo 8 caracteres"
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/50 focus:ring-indigo-400/20 rounded-xl"
            />
            {activeErrors.password && (
              <p className="text-xs text-red-400">
                {activeErrors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-[0_4px_20px_rgba(99,102,241,0.4)] text-white font-semibold rounded-xl transition-all"
          >
            {isPending
              ? "Cargando..."
              : isRegister
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </Button>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">o continúa con</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Botón Google */}
        <div className="flex justify-center">
          <GoogleAuthButton
            onSuccess={(credential) => googleAuthMutation.mutate(credential)}
          />
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              loginForm.reset();
              registerForm.reset();
            }}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isRegister
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </button>
        </div>
      </div>
    </div>
  );
}
