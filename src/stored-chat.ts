import type { UIMessage } from "ai"

// La conversación sigue al cambiar de página: sessionId y mensajes en sessionStorage
// (misma pestaña; se borra al cerrarla). Si el navegador lo bloquea, cada página
// empieza de cero, como antes.

export interface StoredChat {
  sessionId: string
  messages: UIMessage[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isStoredMessage(value: unknown): value is UIMessage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.role === "user" || value.role === "assistant") &&
    Array.isArray(value.parts)
  )
}

export function readStoredChat(key: string): StoredChat | null {
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (
      !isRecord(data) ||
      typeof data.sessionId !== "string" ||
      !Array.isArray(data.messages)
    ) {
      return null
    }
    return {
      sessionId: data.sessionId,
      messages: data.messages.filter(isStoredMessage),
    }
  } catch {
    return null
  }
}

export function writeStoredChat(key: string, chat: StoredChat): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(chat))
  } catch {
    // Almacenamiento lleno o bloqueado: la conversación sigue en memoria.
  }
}
