export interface ValidadorComunidad {
    validar(
        data: any):
        {ok: boolean; error?: string};
}