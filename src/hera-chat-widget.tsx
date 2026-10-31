"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import type { CSSProperties } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import type { HeraChatConfig, HeraTheme } from "./types"
import { stripLeadData } from "./lead-data"
import { parseChatError } from "./chat-error"

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function textOf(message: UIMessage): string {
  return (
    message.parts
      ?.filter(
        (p): p is { type: "text"; text: string } => p.type === "text",
      )
      .map((p) => p.text)
      .join("") ?? ""
  )
}

export function HeraChatWidget({
  apiUrl,
  assistantName = "Hera",
  avatar = "✦",
  subtitle = "Online",
  theme: initialTheme = "dark",
  showThemeToggle = false,
  showNudge: enableNudge = false,
  nudgeText = "Prueba Hera en vivo",
  nudgeDelay = 3000,
  nudgeAutoDismiss = 8000,
  locale = "es",
  emptyMessage,
  placeholder = "Escribe tu mensaje...",
  errorText = "No he podido responder. ¿Lo intentamos de nuevo?",
  retryText = "Reintentar",
  extraBody,
  accentColor,
  accentColorLight,
}: HeraChatConfig) {
  const isInline =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("inline")

  const [isOpen, setIsOpen] = useState(isInline)
  const [hasInteracted, setHasInteracted] = useState(isInline)
  const [theme, setTheme] = useState<HeraTheme>(initialTheme)
  const [showNudge, setShowNudge] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const sessionId = useMemo(() => generateSessionId(), [])

  // Color de marca: las variables van en línea para ganar a los temas de hera.css.
  const accentStyle = useMemo(() => {
    if (!accentColor) return undefined
    const light = accentColorLight ?? accentColor
    return {
      "--hera-accent": accentColor,
      "--hera-accent-light": light,
      "--hera-accent-glow": `color-mix(in srgb, ${light} 40%, transparent)`,
    } as CSSProperties
  }, [accentColor, accentColorLight])

  const defaultEmpty = `Soy ${assistantName}, pregúntame lo que necesites.`

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiUrl,
        body: {
          sessionId,
          // Sin query string: los parámetros de campaña o de sesión de la web no son del chat.
          sourceUrl:
            typeof window !== "undefined"
              ? window.location.origin + window.location.pathname
              : "",
          sourceLang:
            typeof document !== "undefined"
              ? document.documentElement.lang || locale
              : locale,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
          ...extraBody,
        },
      }),
    [sessionId, apiUrl, locale, extraBody],
  )

  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport,
  })

  const isLoading = status === "streaming" || status === "submitted"

  // ── Scroll & focus ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
    if (isOpen) {
      const isMobile = window.matchMedia("(max-width: 640px)").matches
      if (!isMobile && inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [messages, scrollToBottom, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const isMobile = window.matchMedia("(max-width: 640px)").matches
    // En móvil el foco va al panel: en el campo abriría el teclado.
    const target = isMobile ? panelRef.current : inputRef.current
    target?.focus({ preventScroll: true })
    if (!isMobile) return

    // El bloqueo de scroll guarda la posición: sin `top`, la página saltaba al principio.
    const scrollY = window.scrollY
    document.body.style.top = `-${scrollY}px`
    document.body.classList.add("hera-body-lock")
    return () => {
      document.body.classList.remove("hera-body-lock")
      document.body.style.top = ""
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  // Lector de pantalla: se anuncia la respuesta completa al acabar, no token a token.
  const [announcement, setAnnouncement] = useState("")
  const previousStatus = useRef(status)
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (
      previousStatus.current === "streaming" &&
      status === "ready" &&
      last?.role === "assistant"
    ) {
      setAnnouncement(stripLeadData(textOf(last), false))
    }
    previousStatus.current = status
  }, [status, messages])

  // ── Nudge ──
  const nudgeRef = useRef<HTMLDivElement>(null)
  const nudgeDismissed = useRef(false)

  const dismissNudge = useCallback(() => {
    if (nudgeDismissed.current) return
    nudgeDismissed.current = true
    if (nudgeRef.current) {
      nudgeRef.current.style.opacity = "0"
      nudgeRef.current.style.transform = "translateY(4px)"
      nudgeRef.current.style.transition =
        "opacity 0.5s ease, transform 0.5s ease"
      setTimeout(() => setShowNudge(false), 500)
    } else {
      setShowNudge(false)
    }
  }, [])

  useEffect(() => {
    if (!enableNudge) return
    const showTimer = setTimeout(() => {
      nudgeDismissed.current = false
      setShowNudge(true)
    }, nudgeDelay)
    return () => clearTimeout(showTimer)
  }, [enableNudge, nudgeDelay])

  useEffect(() => {
    if (!showNudge) return
    const hideTimer = setTimeout(() => dismissNudge(), nudgeAutoDismiss)
    const onUserScroll = () => dismissNudge()
    const attachTimer = setTimeout(() => {
      window.addEventListener("wheel", onUserScroll, {
        passive: true,
        once: true,
      })
      window.addEventListener("touchmove", onUserScroll, {
        passive: true,
        once: true,
      })
    }, 1000)
    return () => {
      clearTimeout(hideTimer)
      clearTimeout(attachTimer)
      window.removeEventListener("wheel", onUserScroll)
      window.removeEventListener("touchmove", onUserScroll)
    }
  }, [showNudge, dismissNudge, nudgeAutoDismiss])

  // ── Toggle ──
  const handleToggle = useCallback(() => {
    const next = !isOpen
    setIsOpen(next)
    if (!hasInteracted) setHasInteracted(true)
    // Notify parent frame (for iframe embed)
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "hera-chat-toggle", open: next }, "*")
    }
    // Al cerrar, el foco vuelve al botón flotante antes de que el panel quede inerte.
    if (!next && panelRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus()
    }
    if (showNudge) dismissNudge()
  }, [isOpen, hasInteracted, showNudge, dismissNudge])

  // External open event
  useEffect(() => {
    const onOpen = () => {
      if (!isOpen) handleToggle()
    }
    window.addEventListener("hera:open", onOpen)
    return () => window.removeEventListener("hera:open", onOpen)
  }, [isOpen, handleToggle])

  // ── Send ──
  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    sendMessage({ text: trimmed })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ──
  const themeClass = theme === "light" ? "hera-light" : ""
  const chatError = error ? parseChatError(error, errorText) : null
  const lastMessage = messages[messages.length - 1]
  // Los puntos solo hasta que llega el primer texto visible de la respuesta.
  const waitingForText =
    status === "submitted" ||
    (status === "streaming" &&
      (lastMessage?.role !== "assistant" ||
        !stripLeadData(textOf(lastMessage), true)))

  return (
    <>
      {/* Chat panel */}
      <div
        ref={panelRef}
        className={`hera-panel ${isOpen ? "hera-panel--open" : ""} ${hasInteracted && !isOpen ? "hera-panel--closed" : ""} ${themeClass}`}
        style={accentStyle}
        role="dialog"
        aria-label={`Chat con ${assistantName}`}
        tabIndex={-1}
        inert={!isOpen}
        onKeyDown={(e) => {
          if (e.key === "Escape" && isOpen && !isInline) {
            e.stopPropagation()
            handleToggle()
          }
        }}
      >
        <div className="hera-sr-only" role="status" aria-live="polite">
          {announcement}
        </div>

        {/* Header */}
        <div className="hera-header">
          <div className="hera-header__info">
            <div className="hera-header__avatar" aria-hidden="true">
              {avatar}
            </div>
            <div>
              <div className="hera-header__name">{assistantName}</div>
              <div className="hera-header__status">{subtitle}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {showThemeToggle && (
              <button
                className="hera-header__close"
                onClick={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
                aria-label={
                  theme === "dark"
                    ? "Cambiar a modo claro"
                    : "Cambiar a modo oscuro"
                }
              >
                {theme === "dark" ? (
                  <svg aria-hidden="true" focusable="false"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg aria-hidden="true" focusable="false"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            )}
            {!isInline && (
              <button
                className="hera-header__close"
                onClick={handleToggle}
                aria-label="Cerrar chat"
              >
                <svg aria-hidden="true" focusable="false"
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="hera-messages">
          {messages.length === 0 && (
            <div className="hera-empty">
              <div className="hera-empty__icon" aria-hidden="true">
                {avatar}
              </div>
              <p className="hera-empty__text">
                {emptyMessage ?? defaultEmpty}
              </p>
            </div>
          )}
          {messages.map((message, index) => {
            const isUser = message.role === "user"
            const isStreaming =
              status === "streaming" && index === messages.length - 1
            const displayText = stripLeadData(
              textOf(message),
              !isUser && isStreaming,
            )

            if (!displayText) return null

            return (
              <div
                key={message.id}
                className={`hera-msg ${isUser ? "hera-msg--user" : "hera-msg--assistant"}`}
              >
                {!isUser && (
                  <div className="hera-msg__avatar" aria-hidden="true">
                    {avatar}
                  </div>
                )}
                <div
                  className={`hera-msg__bubble ${isUser ? "hera-msg__bubble--user" : "hera-msg__bubble--assistant"}`}
                >
                  {displayText}
                </div>
              </div>
            )
          })}
          {waitingForText && (
            <div className="hera-msg hera-msg--assistant">
              <div
                className="hera-msg__avatar"
                aria-hidden="true"
                style={{
                  animation: "hera-spin-slow 2s linear infinite",
                }}
              >
                {avatar}
              </div>
              <div className="hera-msg__bubble hera-msg__bubble--assistant">
                <span className="hera-typing" aria-hidden="true">
                  <span className="hera-typing__dot" />
                  <span className="hera-typing__dot" />
                  <span className="hera-typing__dot" />
                </span>
                <span className="hera-sr-only">
                  {assistantName} está escribiendo…
                </span>
              </div>
            </div>
          )}
          {chatError && !isLoading && (
            <div className="hera-msg hera-msg--assistant">
              <div className="hera-msg__avatar" aria-hidden="true">
                {avatar}
              </div>
              <div className="hera-error" role="alert">
                <p className="hera-error__text">{chatError.message}</p>
                {chatError.retry && (
                  <button
                    className="hera-error__retry"
                    type="button"
                    onClick={() => regenerate()}
                  >
                    {retryText}
                  </button>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="hera-input">
          <textarea
            ref={inputRef}
            className="hera-input__field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            aria-label={placeholder}
          />
          <button
            className="hera-input__send"
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Enviar mensaje"
          >
            <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path
                d="M14 2L7 9M14 2l-4.5 12-2-5.5L2 6.5 14 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Nudge tooltip */}
      {showNudge && !isOpen && (
        <div
          ref={nudgeRef}
          className="hera-nudge"
          style={accentStyle}
          onClick={dismissNudge}
        >
          <span className="hera-nudge__text">
            {nudgeText} <span className="hera-nudge__sparkle">✦</span>
          </span>
          <span className="hera-nudge__arrow" />
        </div>
      )}

      {/* Floating trigger — hidden in inline/embedded mode */}
      {!isInline && (
        <button
          ref={triggerRef}
          className={`hera-trigger ${isOpen ? "hera-trigger--active" : ""}`}
          style={accentStyle}
          onClick={handleToggle}
          aria-label={
            isOpen ? "Cerrar chat" : `Abrir chat con ${assistantName}`
          }
          aria-expanded={isOpen}
        >
          <span className="hera-trigger__icon hera-trigger__icon--chat">
            <svg aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="hera-trigger__icon hera-trigger__icon--close">
            <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
      )}
    </>
  )
}
