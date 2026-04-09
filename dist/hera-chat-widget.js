"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
export function HeraChatWidget({ apiUrl, assistantName = "Hera", avatar = "✦", subtitle = "Online", theme: initialTheme = "dark", showThemeToggle = false, showNudge: enableNudge = false, nudgeText = "Prueba Hera en vivo", nudgeDelay = 3000, nudgeAutoDismiss = 8000, locale = "es", emptyMessage, placeholder = "Escribe tu mensaje...", errorText = "No he podido responder. ¿Lo intentamos de nuevo?", retryText = "Reintentar", extraBody, }) {
    const isInline = typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("inline");
    const [isOpen, setIsOpen] = useState(isInline);
    const [hasInteracted, setHasInteracted] = useState(isInline);
    const [theme, setTheme] = useState(initialTheme);
    const [showNudge, setShowNudge] = useState(false);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const sessionId = useMemo(() => generateSessionId(), []);
    const defaultEmpty = `Soy ${assistantName}, pregúntame lo que necesites.`;
    const transport = useMemo(() => new DefaultChatTransport({
        api: apiUrl,
        body: {
            sessionId,
            sourceUrl: typeof window !== "undefined" ? window.location.href : "",
            sourceLang: typeof document !== "undefined"
                ? document.documentElement.lang || locale
                : locale,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            ...extraBody,
        },
    }), [sessionId, apiUrl, locale, extraBody]);
    const { messages, sendMessage, status, error, regenerate } = useChat({
        transport,
    });
    const isLoading = status === "streaming" || status === "submitted";
    // ── Scroll & focus ──
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);
    useEffect(() => {
        scrollToBottom();
        if (isOpen) {
            const isMobile = window.matchMedia("(max-width: 640px)").matches;
            if (!isMobile && inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [messages, scrollToBottom, isOpen]);
    useEffect(() => {
        if (isOpen) {
            const isMobile = window.matchMedia("(max-width: 640px)").matches;
            if (!isMobile && inputRef.current) {
                inputRef.current.focus();
            }
            if (isMobile) {
                document.body.classList.add("hera-body-lock");
            }
        }
        else {
            document.body.classList.remove("hera-body-lock");
        }
        return () => {
            document.body.classList.remove("hera-body-lock");
        };
    }, [isOpen]);
    // ── Nudge ──
    const nudgeRef = useRef(null);
    const nudgeDismissed = useRef(false);
    const dismissNudge = useCallback(() => {
        if (nudgeDismissed.current)
            return;
        nudgeDismissed.current = true;
        if (nudgeRef.current) {
            nudgeRef.current.style.opacity = "0";
            nudgeRef.current.style.transform = "translateY(4px)";
            nudgeRef.current.style.transition =
                "opacity 0.5s ease, transform 0.5s ease";
            setTimeout(() => setShowNudge(false), 500);
        }
        else {
            setShowNudge(false);
        }
    }, []);
    useEffect(() => {
        if (!enableNudge)
            return;
        const showTimer = setTimeout(() => {
            nudgeDismissed.current = false;
            setShowNudge(true);
        }, nudgeDelay);
        return () => clearTimeout(showTimer);
    }, [enableNudge, nudgeDelay]);
    useEffect(() => {
        if (!showNudge)
            return;
        const hideTimer = setTimeout(() => dismissNudge(), nudgeAutoDismiss);
        const onUserScroll = () => dismissNudge();
        const attachTimer = setTimeout(() => {
            window.addEventListener("wheel", onUserScroll, {
                passive: true,
                once: true,
            });
            window.addEventListener("touchmove", onUserScroll, {
                passive: true,
                once: true,
            });
        }, 1000);
        return () => {
            clearTimeout(hideTimer);
            clearTimeout(attachTimer);
            window.removeEventListener("wheel", onUserScroll);
            window.removeEventListener("touchmove", onUserScroll);
        };
    }, [showNudge, dismissNudge, nudgeAutoDismiss]);
    // ── Toggle ──
    const handleToggle = useCallback(() => {
        setIsOpen((prev) => {
            const next = !prev;
            if (!hasInteracted)
                setHasInteracted(true);
            // Notify parent frame (for iframe embed)
            if (typeof window !== "undefined" && window.parent !== window) {
                window.parent.postMessage({ type: "hera-chat-toggle", open: next }, "*");
            }
            return next;
        });
        if (showNudge)
            dismissNudge();
    }, [hasInteracted, showNudge, dismissNudge]);
    // External open event
    useEffect(() => {
        const onOpen = () => {
            if (!isOpen)
                handleToggle();
        };
        window.addEventListener("hera:open", onOpen);
        return () => window.removeEventListener("hera:open", onOpen);
    }, [isOpen, handleToggle]);
    // ── Send ──
    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed)
            return;
        sendMessage({ text: trimmed });
        setInput("");
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    // ── Render ──
    const themeClass = theme === "light" ? "hera-light" : "";
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: `hera-panel ${isOpen ? "hera-panel--open" : ""} ${hasInteracted && !isOpen ? "hera-panel--closed" : ""} ${themeClass}`, role: "dialog", "aria-label": `Chat con ${assistantName}`, "aria-hidden": !isOpen, children: [_jsxs("div", { className: "hera-header", children: [_jsxs("div", { className: "hera-header__info", children: [_jsx("div", { className: "hera-header__avatar", children: avatar }), _jsxs("div", { children: [_jsx("div", { className: "hera-header__name", children: assistantName }), _jsx("div", { className: "hera-header__status", children: subtitle })] })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: [showThemeToggle && (_jsx("button", { className: "hera-header__close", onClick: () => setTheme(theme === "dark" ? "light" : "dark"), "aria-label": theme === "dark"
                                            ? "Cambiar a modo claro"
                                            : "Cambiar a modo oscuro", children: theme === "dark" ? (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { cx: "12", cy: "12", r: "4", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] })) : (_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })) })), !isInline && (_jsx("button", { className: "hera-header__close", onClick: handleToggle, "aria-label": "Cerrar chat", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M12 4L4 12M4 4l8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) }))] })] }), _jsxs("div", { className: "hera-messages", children: [messages.length === 0 && (_jsxs("div", { className: "hera-empty", children: [_jsx("div", { className: "hera-empty__icon", children: avatar }), _jsx("p", { className: "hera-empty__text", children: emptyMessage ?? defaultEmpty })] })), messages.map((message) => {
                                const isUser = message.role === "user";
                                const textContent = message.parts
                                    ?.filter((p) => p.type === "text")
                                    .map((p) => p.text)
                                    .join("") ?? "";
                                const displayText = textContent
                                    .replace(/<LEAD_DATA>[\s\S]*?<\/LEAD_DATA>/g, "")
                                    .trim();
                                if (!displayText)
                                    return null;
                                return (_jsxs("div", { className: `hera-msg ${isUser ? "hera-msg--user" : "hera-msg--assistant"}`, children: [!isUser && (_jsx("div", { className: "hera-msg__avatar", children: avatar })), _jsx("div", { className: `hera-msg__bubble ${isUser ? "hera-msg__bubble--user" : "hera-msg__bubble--assistant"}`, children: displayText })] }, message.id));
                            }), isLoading && (_jsxs("div", { className: "hera-msg hera-msg--assistant", children: [_jsx("div", { className: "hera-msg__avatar", style: {
                                            animation: "hera-spin-slow 2s linear infinite",
                                        }, children: avatar }), _jsx("div", { className: "hera-msg__bubble hera-msg__bubble--assistant", children: _jsxs("span", { className: "hera-typing", children: [_jsx("span", { className: "hera-typing__dot" }), _jsx("span", { className: "hera-typing__dot" }), _jsx("span", { className: "hera-typing__dot" })] }) })] })), error && !isLoading && (_jsxs("div", { className: "hera-msg hera-msg--assistant", children: [_jsx("div", { className: "hera-msg__avatar", children: avatar }), _jsxs("div", { className: "hera-error", children: [_jsx("p", { className: "hera-error__text", children: errorText }), _jsx("button", { className: "hera-error__retry", type: "button", onClick: () => regenerate(), "aria-label": retryText, children: retryText })] })] })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "hera-input", role: "form", children: [_jsx("textarea", { ref: inputRef, className: "hera-input__field", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, placeholder: placeholder, rows: 1, "aria-label": placeholder }), _jsx("button", { className: "hera-input__send", type: "button", onClick: handleSend, disabled: !input.trim(), "aria-label": "Enviar mensaje", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M14 2L7 9M14 2l-4.5 12-2-5.5L2 6.5 14 2z", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })] }), showNudge && !isOpen && (_jsxs("div", { ref: nudgeRef, className: "hera-nudge", onClick: dismissNudge, children: [_jsxs("span", { className: "hera-nudge__text", children: [nudgeText, " ", _jsx("span", { className: "hera-nudge__sparkle", children: "\u2726" })] }), _jsx("span", { className: "hera-nudge__arrow" })] })), !isInline && (_jsxs("button", { className: `hera-trigger ${isOpen ? "hera-trigger--active" : ""}`, onClick: handleToggle, "aria-label": isOpen ? "Cerrar chat" : `Abrir chat con ${assistantName}`, "aria-expanded": isOpen, children: [_jsx("span", { className: "hera-trigger__icon hera-trigger__icon--chat", children: _jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("span", { className: "hera-trigger__icon hera-trigger__icon--close", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M12 4L4 12M4 4l8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })] }))] }));
}
//# sourceMappingURL=hera-chat-widget.js.map