import { z } from "zod";
function esMayorDeEdad(fecha: string): boolean {
  const fechaNacimiento = new Date(fecha);
  const hoy = new Date();

  const fechaMayorEdad = new Date(
    fechaNacimiento.getFullYear() + 18,
    fechaNacimiento.getMonth(),
    fechaNacimiento.getDate()
  );

  return hoy >= fechaMayorEdad;
}

export const UserUpdateSchema = z.object({

  firstName: z.string().min(1, "El primer nombre es obligatorio"),

  secondName: z.string().optional(),

  lastName: z.string().min(1, "El apellido es obligatorio"),

  secondLastName: z.string().optional(),

  dateOfBirth: z.string()
    .refine(value => !isNaN(Date.parse(value)), {
      message: "La fecha no es válida"
    })
    .refine(value => esMayorDeEdad(value), {
      message: "Debe ser mayor de edad"
    }),

  height: z.string()
    .max(3, "La altura debe tener máximo 3 caracteres")
    .optional(),

  weight: z.string()
    .max(3, "El peso debe tener máximo 3 caracteres")
    .optional(),

  gender: z.enum(["M", "F"]).optional(),

});
