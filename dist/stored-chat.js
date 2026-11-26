function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isStoredMessage(value) {
    return (isRecord(value) &&
        typeof value.id === "string" &&
        (value.role === "user" || value.role === "assistant") &&
        Array.isArray(value.parts));
}
export function readStoredChat(key) {
    try {
        const raw = window.sessionStorage.getItem(key);
        if (!raw)
            return null;
        const data = JSON.parse(raw);
        if (!isRecord(data) ||
            typeof data.sessionId !== "string" ||
            !Array.isArray(data.messages)) {
            return null;
        }
        return {
            sessionId: data.sessionId,
            messages: data.messages.filter(isStoredMessage),
        };
    }
    catch {
        return null;
    }
}
export function writeStoredChat(key, chat) {
    try {
        window.sessionStorage.setItem(key, JSON.stringify(chat));
    }
    catch {
        // Almacenamiento lleno o bloqueado: la conversación sigue en memoria.
    }
}
//# sourceMappingURL=stored-chat.js.map