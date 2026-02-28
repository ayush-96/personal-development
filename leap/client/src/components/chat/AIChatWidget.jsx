import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { SessionSwitcher } from './session/SessionSwitcher'
import { useSessions } from './session/useSessions'
import { ChatConversation } from './conversation/ChatConversation'
import { ChatInput } from './input/ChatInput'

import { useChatOverview } from '../../hooks/chat/useChatOverview'
import { useChatSessions } from '../../hooks/chat/useChatSessions'
import { useChatMessages } from '../../hooks/chat/useChatMessages'

const DEFAULT_SPACE_ID = 2


const MODELS = [
    { id: 'General', name: 'General' },
    { id: 'RAG-mode', name: 'RAG-mode' },
    { id: 'Study-mode', name: 'Study-mode' },
]

// Maps model to assistant key for session retrieval from overview
// Note: Study-mode uses OpenAI assistant for creation, but sessions are returned under 'Study' key
const modelToAssistantKey = {
    General: 'OpenAI',
    'Study-mode': 'Study', // Study sessions are returned separately in overview.assistants.Study
    'RAG-mode': 'RagFlow',
}

const modelToMode = {
    General: 'GENERAL',
    'Study-mode': 'STUDY',
    'RAG-mode': 'RAG',
}

function buildModelsWithAvailability(assistantAvailability) {
    return MODELS.map((m) => {
        if (m.id === 'General') {
            return { ...m, disabled: false, disabledReason: '' }
        }
        if (m.id === 'Study-mode') {
            return { ...m, disabled: false, disabledReason: '' }
        }
        if (m.id === 'RAG-mode') {
            const rag = assistantAvailability?.RagFlow
            if (!rag) {
                return { ...m, disabled: true, disabledReason: 'Preparing…' }
            }
            if (!rag.ready) {
                return { ...m, disabled: true, disabledReason: `RagFlow is ${rag.status}` }
            }
            return { ...m, disabled: false, disabledReason: '' }
        }
        return { ...m, disabled: false, disabledReason: '' }
    })
}


export function AIChatWidget({ spaceId = DEFAULT_SPACE_ID }) {
    const overviewHook = useChatOverview(spaceId, {
        pollRagflow: true,
        pollIntervalMs: 5000,
    })
    const overview = overviewHook.overview
    const assistantAvailability = overviewHook.assistantAvailability

    const [selectedModel, setSelectedModel] = useState('General')
    const modelsWithAvailability = useMemo(
        () => buildModelsWithAvailability(assistantAvailability),
        [assistantAvailability],
    )

    useEffect(() => {
        const current = modelsWithAvailability.find((m) => m.id === selectedModel)
        if (current?.disabled) {
            const fallback = modelsWithAvailability.find((m) => !m.disabled)
            if (fallback) setSelectedModel(fallback.id)
        }
    }, [modelsWithAvailability, selectedModel])

    /* ---------------- Sessions ---------------- */
    const desiredAssistantKey = modelToAssistantKey[selectedModel] || 'OpenAI'

    // ⚠️ 永远保证 overview.assistants 有 OpenAI / RagFlow
    const safeOverview = useMemo(() => {
        return {
            spaceId,
            assistants: {
                OpenAI: { sessions: [] },
                RagFlow: { sessions: [] },
                Study: { sessions: [] }, // Study mode sessions
                ...(overview?.assistants || {}),
            },
        }
    }, [overview, spaceId])

    const assistantKey =
        safeOverview.assistants[desiredAssistantKey]
            ? desiredAssistantKey
            : 'OpenAI'

    const sessions = useSessions({
        overview: safeOverview,
        assistantKey,
        initialSessionId:
            safeOverview.assistants[assistantKey]?.sessions?.[0]?.id,
    })

    const currentSessionId = sessions.currentSessionId

    /* ---------------- Session APIs ---------------- */
    const sessionsApi = useChatSessions({
        onSuccess: async ({ action }) => {
            if (action === 'create' || action === 'rename' || action === 'delete') {
                await overviewHook.refresh()
            }
        },
    })

    /* ---------------- Messages ---------------- */
    const msgHook = useChatMessages(currentSessionId)

    const uiMessages = useMemo(
        () =>
            msgHook.messages.map((m) => ({
                id: String(m.id),
                role: m.role,
                content: m.content || '',
                isStreaming: false,
            })),
        [msgHook.messages],
    )

    const isTyping = msgHook.sending

    /* ---------------- Handlers ---------------- */
    const handleCreateSession = useCallback(async () => {
        const mode = modelToMode[selectedModel] || 'GENERAL'
        const created = await sessionsApi.createSession({ spaceId, mode })
        if (created?.id) {
            // Wait for overview to refresh so the session appears in the correct array
            await overviewHook.refresh()
            // Then switch to the newly created session
            sessions.switchSession(created.id)
        }
    }, [selectedModel, spaceId, sessionsApi, sessions, overviewHook])

    const handleSaveRename = useCallback(async () => {
        const id = sessions.editingSessionId
        const title = sessions.editingTitle?.trim()
        if (!id || !title) return
        await sessionsApi.renameSession({ sessionId: id, title })
        sessions.cancelRename()
    }, [sessions, sessionsApi])

    const handleDeleteSession = useCallback(
        async (id) => {
            await sessionsApi.deleteSession(id)
        },
        [sessionsApi],
    )

    /* ---------------- Input ---------------- */
    const [inputValue, setInputValue] = useState('')

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault()
            if (!inputValue.trim()) return
            if (isTyping) return
            if (!currentSessionId) return

            await msgHook.sendMessage(inputValue)
            setInputValue('')
        },
        [inputValue, isTyping, currentSessionId, msgHook],
    )

    const headerTitle = sessions.currentSession?.title || 'New Session'
    const isOverviewLoading = overviewHook.loading && !overview

    /* ---------------- Render ---------------- */
    return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                <span className="truncate text-sm font-medium">
                    {isOverviewLoading ? 'Loading…' : headerTitle}
                </span>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCreateSession}
                        disabled={sessionsApi.creating}
                    >
                        <PlusIcon className="h-4 w-4" />
                    </Button>

                    <SessionSwitcher
                        sessions={sessions.sessions}
                        currentSessionId={sessions.currentSessionId}
                        editingSessionId={sessions.editingSessionId}
                        editingTitle={sessions.editingTitle}
                        setEditingTitle={sessions.setEditingTitle}
                        onSwitch={sessions.switchSession}
                        onStartRename={sessions.startRename}
                        onCancelRename={sessions.cancelRename}
                        onSaveRename={handleSaveRename}
                        onDelete={handleDeleteSession}
                    />
                </div>
            </div>

            {/* Conversation */}
            <ChatConversation messages={uiMessages} />

            {/* Input */}
            <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSubmit}
                models={modelsWithAvailability}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={isTyping || !currentSessionId}
            />
        </div>
    )
}