"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin, useRegister } from "@/lib/hooks/use-auth";
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/logo-stward.png"
              alt="Stward Corporation"
              width={180}
              height={48}
              priority
              className="dark:invert"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {isRegister ? "Crear cuenta" : "Iniciar sesión"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Stward Task — Gestión de proyectos
            </p>
          </div>
        </CardHeader>
        <CardContent>
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
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    {...registerForm.register("first_name")}
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    {...registerForm.register("last_name")}
                    placeholder="Pérez"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                {...(isRegister
                  ? registerForm.register("email")
                  : loginForm.register("email"))}
                placeholder="correo@ejemplo.com"
                autoFocus
              />
              {activeErrors.email && (
                <p className="text-xs text-red-500">
                  {activeErrors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                {...(isRegister
                  ? registerForm.register("password")
                  : loginForm.register("password"))}
                placeholder="Mínimo 8 caracteres"
              />
              {activeErrors.password && (
                <p className="text-xs text-red-500">
                  {activeErrors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending
                ? "Cargando..."
                : isRegister
                  ? "Crear cuenta"
                  : "Iniciar sesión"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                loginForm.reset();
                registerForm.reset();
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRegister
                ? "¿Ya tienes cuenta? Inicia sesión"
                : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
