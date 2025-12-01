export interface Validador {
    validar(data: any):
        {ok: boolean; error?: string};
}