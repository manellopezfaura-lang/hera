import { createRoot } from "react-dom/client"
import { HeraChatWidget } from "../src/hera-chat-widget"
import type { HeraTheme } from "../src/types"

// Se lee al cargar el script: tras esperar a DOMContentLoaded, currentScript ya es null.
const loadingScript =
  document.currentScript instanceof HTMLScriptElement
    ? document.currentScript
    : null

const HEX_COLOR = /^#[0-9a-f]{6}$/i

function colorAttribute(value: string | undefined): string | undefined {
  return value && HEX_COLOR.test(value) ? value : undefined
}

function httpsAttribute(value: string | undefined): string | undefined {
  return value && value.startsWith("https://") ? value : undefined
}

function pixelsAttribute(value: string | undefined): number | undefined {
  const pixels = Number(value)
  return value && Number.isFinite(pixels) && pixels >= 0 && pixels <= 400
    ? pixels
    : undefined
}

function init() {
  const script =
    loadingScript ??
    document.querySelector<HTMLScriptElement>("script[data-hera-api]")

  if (!script) return

  const apiUrl = script.dataset.heraApi
  if (!apiUrl) {
    console.warn("[Hera] Missing data-hera-api attribute")
    return
  }

  const config = {
    apiUrl,
    assistantName: script.dataset.heraName ?? "Hera",
    avatar: script.dataset.heraAvatar ?? "✦",
    subtitle: script.dataset.heraSubtitle ?? "Online",
    theme: (script.dataset.heraTheme ?? "dark") as HeraTheme,
    showThemeToggle: script.dataset.heraThemeToggle === "true",
    showNudge: script.dataset.heraNudge !== "false",
    nudgeText: script.dataset.heraNudgeText ?? "¿Necesitas ayuda?",
    locale: script.dataset.heraLocale ?? "es",
    emptyMessage: script.dataset.heraEmpty,
    placeholder: script.dataset.heraPlaceholder,
    accentColor: colorAttribute(script.dataset.heraAccent),
    accentColorLight: colorAttribute(script.dataset.heraAccentLight),
    avatarUrl: httpsAttribute(script.dataset.heraAvatarUrl),
    disclaimer: script.dataset.heraDisclaimer,
    privacyUrl: httpsAttribute(script.dataset.heraPrivacyUrl),
    privacyLabel: script.dataset.heraPrivacyLabel,
    mobileBottom: pixelsAttribute(script.dataset.heraMobileBottom),
    mobileRight: pixelsAttribute(script.dataset.heraMobileRight),
    hideWhileOpen: script.dataset.heraHideWhileOpen,
    persist: script.dataset.heraPersist === "true",
  }

  const container = document.createElement("div")
  container.id = "hera-widget-root"
  // Ni GTranslate ni el traductor del navegador deben tocar el chat: el idioma de
  // las respuestas lo decide el asistente.
  container.setAttribute("translate", "no")
  container.classList.add("notranslate")
  container.lang = config.locale
  document.body.appendChild(container)

  // Se monta cuando carga la hoja de estilos, para no pintar el panel sin estilos.
  let mounted = false
  const mount = () => {
    if (mounted) return
    mounted = true
    createRoot(container).render(<HeraChatWidget {...config} />)
  }

  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = new URL("hera.css", script.src).href
  link.addEventListener("load", mount)
  link.addEventListener("error", mount)
  setTimeout(mount, 3000)
  document.head.appendChild(link)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
