import { createRoot } from "react-dom/client"
import { HeraChatWidget } from "../src/hera-chat-widget"
import type { HeraTheme } from "../src/types"

function init() {
  const script =
    document.currentScript ??
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
  }

  // Inject CSS
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = new URL("hera.css", script.src).href
  document.head.appendChild(link)

  // Mount widget
  const container = document.createElement("div")
  container.id = "hera-widget-root"
  document.body.appendChild(container)

  createRoot(container).render(<HeraChatWidget {...config} />)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
