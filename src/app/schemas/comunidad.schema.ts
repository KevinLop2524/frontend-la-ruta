import { z } from "zod";

export const comunidadSchema= z.object({
    category: z.string().min(1, "Tematica requerida").regex(/[a-zA-Z]/, "El contenido es invalido"),
    name: z.string().min(1, "Nombre requerido").regex(/[a-zA-Z]/, "El nombre es invalido"),
    description: z.string().min(15, "La descripción debe tener minimo 15 caracteres").max(250, "La descripción excede el limite de caracteres permitidos").regex(/[a-zA-Z]/, "La descripción es invalida"),
    creatorId: z.number(),
    active: z.boolean().default(true)
});

export type ComunidadNueva = z.infer<typeof comunidadSchema>;