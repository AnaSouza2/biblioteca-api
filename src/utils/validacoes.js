export function idInvalido(id){
    return !Number.isInteger(id) || id <= 0;
}

export function textoInvalido(valor) {
    return typeof valor !== "string" || valor.trim().length === 0;

}

export function emailInvalido(email) {
    if(textoInvalido(email)){
        return true;
    }

    const formatoEmail =  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !formatoEmail.test(email.trim());
}