// El motor marca el lead con un bloque <LEAD_DATA>…</LEAD_DATA> al final de la
// respuesta: es para el servidor y no debe verse nunca, tampoco a medio llegar.
const CLOSED_BLOCK = /<LEAD_DATA>[\s\S]*?<\/LEAD_DATA>/g;
const OPEN_BLOCK = /<LEAD_DATA>[\s\S]*$/;
const TAG = "<LEAD_DATA>";
export function stripLeadData(text, streaming) {
    let visible = text.replace(CLOSED_BLOCK, "").replace(OPEN_BLOCK, "");
    if (streaming) {
        // Mientras llega el stream, un final como "<LEAD" todavía puede ser la etiqueta.
        for (let length = TAG.length - 1; length > 0; length--) {
            if (visible.endsWith(TAG.slice(0, length))) {
                visible = visible.slice(0, -length);
                break;
            }
        }
    }
    return visible.trim();
}
//# sourceMappingURL=lead-data.js.map