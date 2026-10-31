export interface ChatErrorView {
    message: string;
    retry: boolean;
}
export declare function parseChatError(error: Error, fallback: string): ChatErrorView;
//# sourceMappingURL=chat-error.d.ts.map