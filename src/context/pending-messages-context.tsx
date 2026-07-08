import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface PendingMessage {
    id: string;
    chatId: number;
    content?: string;
    caption?: string;
    audioUrl?: string;
    durationSeconds?: number;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    messageType: 'TEXT' | 'VOICE' | 'IMAGE' | 'VIDEO' | 'FILE';
    timestamp: Date;
    senderName: string;
}

interface PendingMessagesContextType {
    pendingMessages: PendingMessage[];
    addPendingMessage: (message: Omit<PendingMessage, 'id'>) => string;
    removePendingMessage: (id: string) => void;
    clearPendingMessages: (chatId: number) => void;
}

const PendingMessagesContext = createContext<PendingMessagesContextType | undefined>(undefined);

export function PendingMessagesProvider({ children }: { children: ReactNode }) {
    const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

    const addPendingMessage = useCallback(
        (message: Omit<PendingMessage, 'id'>) => {
            const id = `pending-${Date.now()}-${Math.random()}`;
            setPendingMessages((prev) => [
                ...prev,
                {
                    ...message,
                    id,
                },
            ]);
            return id;
        },
        []
    );

    const removePendingMessage = useCallback((id: string) => {
        setPendingMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, []);

    const clearPendingMessages = useCallback((chatId: number) => {
        setPendingMessages((prev) => prev.filter((msg) => msg.chatId !== chatId));
    }, []);

    return (
        <PendingMessagesContext.Provider
            value={{
                pendingMessages,
                addPendingMessage,
                removePendingMessage,
                clearPendingMessages,
            }}
        >
            {children}
        </PendingMessagesContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePendingMessages() {
    const context = useContext(PendingMessagesContext);
    if (!context) {
        throw new Error('usePendingMessages must be used within PendingMessagesProvider');
    }
    return context;
}
