import {comunidadSchema} from "../schemas/comunidad.schema"
import { Validador } from "../interfaces/validador"


export class comunidadZodValidator implements Validador{
    
    validar(data: any) { 
        const r= comunidadSchema.safeParse(data);

        return r.success
        ?{ok: true}
        :{ok: false, error: r.error.errors[0].message}
    }
}