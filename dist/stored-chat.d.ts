import type { UIMessage } from "ai";
export interface StoredChat {
    sessionId: string;
    messages: UIMessage[];
}
export declare function readStoredChat(key: string): StoredChat | null;
export declare function writeStoredChat(key: string, chat: StoredChat): void;
//# sourceMappingURL=stored-chat.d.ts.map