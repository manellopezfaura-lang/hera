import type { ReactNode } from "react"

// Texto plano del modelo → texto con teléfonos, emails y enlaces pulsables. Sin HTML:
// solo nodos de React, y solo enlaces http(s), mailto y tel.

const LINK_PATTERN = new RegExp(
  [
    String.raw`(https?:\/\/[^\s<>"']+)`,
    String.raw`(www\.[^\s<>"']+)`,
    String.raw`([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)`,
    // Teléfonos españoles de 9 cifras, con o sin +34 y con espacios, puntos o guiones.
    String.raw`((?<!\d)(?:\+34[\s.-]?)?[6789]\d{2}(?:[\s.-]?\d){6}(?!\d))`,
    String.raw`((?<![\w.@/-])[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|es|cat|org|net|eu)(?:\/[^\s<>"']*)?)`,
  ].join("|"),
  "gi",
)

const TRAILING_PUNCTUATION = /[.,;:!?)»"']+$/

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*[-*][ \t]+/gm, "· ")
}

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "")
  return `tel:${digits.startsWith("+") ? digits : `+34${digits}`}`
}

export function formatMessage(text: string): ReactNode[] {
  const clean = cleanMarkdown(text)
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of clean.matchAll(LINK_PATTERN)) {
    const [raw, url, , email, phone] = match
    const start = match.index ?? 0
    let label = raw
    let trailing = ""
    if (!email && !phone) {
      trailing = label.match(TRAILING_PUNCTUATION)?.[0] ?? ""
      label = label.slice(0, label.length - trailing.length)
    }
    if (!label) continue

    const href = url
      ? label
      : email
        ? `mailto:${label}`
        : phone
          ? telHref(label)
          : `https://${label}`
    const external = !email && !phone

    if (start > cursor) nodes.push(clean.slice(cursor, start))
    nodes.push(
      <a
        key={start}
        className="hera-msg__link"
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {label}
      </a>,
    )
    if (trailing) nodes.push(trailing)
    cursor = start + raw.length
  }

  if (cursor < clean.length) nodes.push(clean.slice(cursor))
  return nodes
}
