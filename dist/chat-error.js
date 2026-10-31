// El motor responde los errores como JSON { error, retry } y el transporte del AI SDK
// los lanza como Error con el cuerpo de la respuesta en `message`.
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
export function parseChatError(error, fallback) {
    try {
        const body = JSON.parse(error.message);
        if (isRecord(body) && typeof body.error === "string" && body.error.trim()) {
            return { message: body.error, retry: body.retry !== false };
        }
    }
    catch {
        // Error de red o respuesta sin JSON: mensaje genérico.
    }
    return { message: fallback, retry: true };
}
//# sourceMappingURL=chat-error.js.map