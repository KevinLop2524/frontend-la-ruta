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

export const userSchema = z.object({

  // Obligatorio: mínimo 1 letra real (nada de espacios)
  firstName: z.string()
    .min(1, "Nombre requerido")
    .regex(/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/, "El nombre ingresado es inválido"),

  // Opcional pero si viene debe ser válido
  secondName: z.string()
    .regex(/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/, "El segundo nombre ingresado es inválido")
    .optional()
    .or(z.literal("")),

  // Obligatorio
  lastName: z.string()
    .min(1, "Apellido requerido")
    .regex(/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/, "El apellido ingresado es inválido"),

  // Opcional
  secondLastName: z.string()
    .regex(/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/, "El segundo apellido ingresado es inválido")
    .optional()
    .or(z.literal("")),

  // Obligatorio y con formato real de email
  email: z.string()
    .min(1, "Gmail requerido")
    .email("El correo ingresado es inválido"),

  // Obligatorio y con reglas reales de contraseña
  password: z.string()
    .min(6, "La contraseña debe tener mínimo 6 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),

  // Obligatorio
  username: z.string()
    .min(3, "El nombre de usuario debe tener mínimo 3 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "El nombre de usuario solo puede tener letras, números o guiones bajos"),

  // Obligatoria, formato y fecha válida real
   dateOfBirth: z.string()
      .refine(value => !isNaN(Date.parse(value)), {
        message: "La fecha no es válida"
      })
      .refine(value => esMayorDeEdad(value), {
        message: "Debe ser mayor de edad"
      }),
  

  // Opcional, solo 2 valores permitidos
  gender: z.enum(["M", "F"])
    .optional(),

  // Opcional, valida número en caso de existir
  weight: z.string()
    .regex(/^\d+$/, "El peso debe ser un número").max(3, "El peso debe tener maximo tres caracteres")
    .optional(),

  height: z.number()
    .positive("La altura debe ser un número positivo")
    .optional(),

});
