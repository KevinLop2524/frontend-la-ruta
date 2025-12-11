import { UserUpdateSchema } from "../schemas/UpdateUser.schema"
import { Validador } from "../interfaces/validador"

export class userZodValidator implements Validador
{
    validar(data:any)
    {
        const r= UserUpdateSchema.safeParse(data);

        return r.success
        ?{ok: true}
        :{ok: false, error: r.error.errors[0].message}
    }
}