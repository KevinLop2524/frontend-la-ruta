import {comunidadSchema} from "../schemas/comunidad.schema"
import { ValidadorComunidad } from "../interfaces/validador-comunidad"


export class comunidadZodValidator implements ValidadorComunidad{
    
    validar(data: any) { 
        const r= comunidadSchema.safeParse(data);

        return r.success
        ?{ok: true}
        :{ok: false, error: r.error.errors[0].message}
    }
}