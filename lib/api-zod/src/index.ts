import { z } from "zod";

export const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["creator", "editor"]),
});

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreateVideoBody = z.object({
  title: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  fileSize: z.number().optional(),
  duration: z.number().optional(),
});

export const RejectVideoBody = z.object({
  feedback: z.string().min(1),
});

export const HealthCheckResponse = z.object({
  status: z.string(),
});

export type RegisterBodyType = z.infer<typeof RegisterBody>;
export type LoginBodyType = z.infer<typeof LoginBody>;
export type CreateVideoBodyType = z.infer<typeof CreateVideoBody>;
export type RejectVideoBodyType = z.infer<typeof RejectVideoBody>;
