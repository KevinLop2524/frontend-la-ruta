import { z } from "zod";

export const comunidadSchema= z.object({
    tematica: z.string().min(1, "Tematica requerida").regex(/[a-zA-Z]/, "El contenido es invalido"),
    nombre: z.string().min(1, "Nombre requerido").regex(/[a-zA-Z]/, "El nombre es invalido"),
    descripcion: z.string().min(1, "Descripción requerida").regex(/[a-zA-Z]/, "La descripción es invalida"),
    tipo: z.string().min(1, "Tipo requerida").regex(/[a-zA-Z]/, "El tipo de comunidad es invalido"),
    idCreador: z.number(),
    estado: z.string().default("activo")
});

export type ComunidadNueva = z.infer<typeof comunidadSchema>;