import { z } from "zod";

// ─── Auth ───────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Correo electrónico inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Correo electrónico inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});
export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Workspace ──────────────────────────────────
export const workspaceSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
});
export type WorkspaceFormData = z.infer<typeof workspaceSchema>;

// ─── Board ──────────────────────────────────────
export const boardSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
});
export type BoardFormData = z.infer<typeof boardSchema>;

// ─── Task ───────────────────────────────────────
export const taskSchema = z
  .object({
    title: z
      .string()
      .min(1, "El título es obligatorio")
      .max(200, "Máximo 200 caracteres"),
    description: z.string().max(2000, "Máximo 2000 caracteres").optional(),
    priority: z.enum(["none", "low", "medium", "high", "urgent"]).default("none"),
    assignee_name: z.string().max(100).optional(),
    start_date: z.string().optional().or(z.literal("")),
    end_date: z.string().optional().or(z.literal("")),
    progress: z.coerce.number().min(0).max(100).default(0),
    assignee_ids: z.array(z.string()).optional().default([]),
    parent_id: z.string().uuid().nullable().optional(),
    dependency_ids: z.array(z.string().uuid()).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date <= data.end_date;
      }
      return true;
    },
    {
      message: "La fecha de inicio debe ser anterior a la fecha de fin",
      path: ["end_date"],
    }
  );
export type TaskFormData = z.infer<typeof taskSchema>;
