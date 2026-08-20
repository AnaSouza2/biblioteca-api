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
export function dataInvalida(valor) {
    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
        return true;
    }

    const data = new Date(`${valor}T00:00:00Z`);

    return (
        Number.isNaN(data.getTime()) ||
        data.toISOString().slice(0, 10) !== valor
    );
}

export function dataAnteriorAHoje(valor) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const data = new Date(`${valor}T00:00:00`);

    return data < hoje;
}