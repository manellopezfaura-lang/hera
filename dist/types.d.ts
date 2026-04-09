export type HeraRole = "user" | "assistant";
export interface HeraMessage {
    role: HeraRole;
    content: string;
}
export interface HeraLeadData {
    nombre: string;
    email: string;
    proyecto?: string;
    servicios_interes?: string;
    contexto?: string;
}
export type HeraTheme = "dark" | "light";
export interface HeraChatConfig {
    /** API endpoint for chat messages */
    apiUrl: string;
    /** Display name for the assistant (default: "Hera") */
    assistantName?: string;
    /** Avatar content — letter or emoji (default: "✦") */
    avatar?: string;
    /** Studio/brand name shown as subtitle (default: "Online") */
    subtitle?: string;
    /** Initial theme (default: "dark") */
    theme?: HeraTheme;
    /** Show theme toggle button in header (default: false) */
    showThemeToggle?: boolean;
    /** Show nudge tooltip after delay (default: false) */
    showNudge?: boolean;
    /** Nudge text (default: "Prueba Hera en vivo") */
    nudgeText?: string;
    /** Delay in ms before showing nudge (default: 3000) */
    nudgeDelay?: number;
    /** Auto-dismiss nudge after ms (default: 8000) */
    nudgeAutoDismiss?: number;
    /** Source language sent to API (default: "es") */
    locale?: string;
    /** Empty state message */
    emptyMessage?: string;
    /** Input placeholder text */
    placeholder?: string;
    /** Error retry text */
    errorText?: string;
    /** Error retry button text */
    retryText?: string;
    /** Additional body params sent with each request */
    extraBody?: Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map