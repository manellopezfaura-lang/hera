import { jsx as _jsx } from "react/jsx-runtime";
// Texto plano del modelo → texto con teléfonos, emails y enlaces pulsables. Sin HTML:
// solo nodos de React, y solo enlaces http(s), mailto y tel.
const LINK_PATTERN = new RegExp([
    String.raw `(https?:\/\/[^\s<>"']+)`,
    String.raw `(www\.[^\s<>"']+)`,
    String.raw `([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)`,
    // Teléfonos españoles de 9 cifras, con o sin +34 y con espacios, puntos o guiones.
    String.raw `((?<!\d)(?:\+34[\s.-]?)?[6789]\d{2}(?:[\s.-]?\d){6}(?!\d))`,
    String.raw `((?<![\w.@/-])[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|es|cat|org|net|eu)(?:\/[^\s<>"']*)?)`,
].join("|"), "gi");
const TRAILING_PUNCTUATION = /[.,;:!?)»"']+$/;
function cleanMarkdown(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/^#{1,6}[ \t]+/gm, "")
        .replace(/^[ \t]*[-*][ \t]+/gm, "· ");
}
// Un móvil español con «WhatsApp» justo delante abre el chat de WhatsApp; el resto, una llamada.
const WHATSAPP_CONTEXT = /whats\s?app/i;
const WHATSAPP_LOOKBEHIND = 24;
function phoneHref(phone, context) {
    const digits = phone.replace(/\D/g, "");
    const national = digits.length === 11 && digits.startsWith("34") ? digits.slice(2) : digits;
    const isMobile = national.startsWith("6") || national.startsWith("7");
    return isMobile && WHATSAPP_CONTEXT.test(context)
        ? `https://wa.me/34${national}`
        : `tel:+34${national}`;
}
export function formatMessage(text) {
    const clean = cleanMarkdown(text);
    const nodes = [];
    let cursor = 0;
    for (const match of clean.matchAll(LINK_PATTERN)) {
        const [raw, url, , email, phone] = match;
        const start = match.index ?? 0;
        let label = raw;
        let trailing = "";
        if (!email && !phone) {
            trailing = label.match(TRAILING_PUNCTUATION)?.[0] ?? "";
            label = label.slice(0, label.length - trailing.length);
        }
        if (!label)
            continue;
        const href = url
            ? label
            : email
                ? `mailto:${label}`
                : phone
                    ? phoneHref(label, clean.slice(Math.max(cursor, start - WHATSAPP_LOOKBEHIND), start))
                    : `https://${label}`;
        const external = href.startsWith("https://") || href.startsWith("http://");
        if (start > cursor)
            nodes.push(clean.slice(cursor, start));
        nodes.push(_jsx("a", { className: "hera-msg__link", href: href, ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}), children: label }, start));
        if (trailing)
            nodes.push(trailing);
        cursor = start + raw.length;
    }
    if (cursor < clean.length)
        nodes.push(clean.slice(cursor));
    return nodes;
}
//# sourceMappingURL=format-message.js.map