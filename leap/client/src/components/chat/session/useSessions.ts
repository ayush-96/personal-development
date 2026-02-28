import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type ChatSession = {
    id: number
    title: string
    created_at?: string
    updated_at?: string
}

export type ChatOverview = {
    spaceId: number
    assistants: Record<string, { sessions: ChatSession[] }>
}

type UseSessionsParams = {
    overview: ChatOverview
    assistantKey: string
    initialSessionId?: number
}

/**
 * useSessions：只负责“选择当前 session + 编辑状态 + 排序”
 * - 不负责后端交互（rename/delete/create 在外层做）
 * - 不直接修改 overview（overview 由上层 hooks 刷新）
 */
export function useSessions({ overview, assistantKey, initialSessionId }: UseSessionsParams) {
    const [currentSessionId, setCurrentSessionId] = useState<number | undefined>(initialSessionId)

    const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
    const [editingTitle, setEditingTitle] = useState('')

    // 记住上一次 assistantKey，用于切换模型时更好地选择默认 session
    const prevAssistantKeyRef = useRef<string | null>(null)

    const rawSessions: ChatSession[] = useMemo(() => {
        return overview?.assistants?.[assistantKey]?.sessions ?? []
    }, [overview, assistantKey])

    // 按 updated_at desc 排序（没有 updated_at 就当作 0）
    const sessions: ChatSession[] = useMemo(() => {
        const toTime = (s: ChatSession) => {
            const t = s.updated_at ? new Date(s.updated_at).getTime() : 0
            return Number.isFinite(t) ? t : 0
        }

        return [...rawSessions].sort((a, b) => toTime(b) - toTime(a))
    }, [rawSessions])

    const currentSession: ChatSession | undefined = useMemo(() => {
        if (!currentSessionId) return undefined
        return sessions.find((s) => s.id === currentSessionId)
    }, [sessions, currentSessionId])

    /**
     * 选择“最合适”的默认 session：
     * 1) 如果 initialSessionId 在列表里 → 用它
     * 2) 否则用 sessions[0]（最新 updated）
     * 3) 否则 undefined
     */
    const pickBestSessionId = useCallback(
        (list: ChatSession[], preferredId?: number) => {
            if (!list.length) return undefined
            if (preferredId && list.some((s) => s.id === preferredId)) return preferredId
            return list[0].id
        },
        [],
    )

    /**
     * ✅ 核心：当 overview/assistantKey 变化时，自动确保 currentSessionId 合法
     * - 第一次 overview 异步回来：会自动选中最新 session
     * - 切换 assistantKey：会选新 assistant 的最新 session（或 initialSessionId）
     * - 当前 session 被删除：自动回退到最新 session
     */
    useEffect(() => {
        const prevKey = prevAssistantKeyRef.current
        const assistantChanged = prevKey !== null && prevKey !== assistantKey

        // 如果切换了 assistantKey：重新选一个（优先 initialSessionId，其次最新）
        if (assistantChanged) {
            const nextId = pickBestSessionId(sessions, initialSessionId)
            setCurrentSessionId(nextId)
            setEditingSessionId(null)
            setEditingTitle('')
            prevAssistantKeyRef.current = assistantKey
            return
        }

        // 初次 mount 时记录 assistantKey
        if (prevAssistantKeyRef.current === null) {
            prevAssistantKeyRef.current = assistantKey
        }

        // 如果当前没有选中 session（常见：overview 还没回来时初始化为 undefined）
        if (!currentSessionId) {
            const nextId = pickBestSessionId(sessions, initialSessionId)
            if (nextId) setCurrentSessionId(nextId)
            return
        }

        // 如果当前 sessionId 在新列表里找不到（被删了或 provider 变了）
        // BUT: Allow currentSessionId to persist if it was just set (optimistic update)
        // This prevents clearing the session immediately after creation before overview refreshes
        const stillExists = sessions.some((s) => s.id === currentSessionId)
        if (!stillExists && sessions.length > 0) {
            // Only reset if there are other sessions available
            // If no sessions exist, keep currentSessionId (might be a newly created session)
            const nextId = pickBestSessionId(sessions, initialSessionId)
            setCurrentSessionId(nextId)
            setEditingSessionId(null)
            setEditingTitle('')
        }
    }, [assistantKey, sessions, currentSessionId, initialSessionId, pickBestSessionId])

    /* ---------- Actions ---------- */
    const switchSession = useCallback((id: number) => {
        setCurrentSessionId(id)
        setEditingSessionId(null)
        setEditingTitle('')
    }, [])

    const startRename = useCallback((id: number, title: string) => {
        setEditingSessionId(id)
        setEditingTitle(title ?? '')
    }, [])

    const cancelRename = useCallback(() => {
        setEditingSessionId(null)
        setEditingTitle('')
    }, [])

    return {
        // list
        sessions,

        // current
        currentSessionId,
        currentSession,

        // rename UI state
        editingSessionId,
        editingTitle,
        setEditingTitle,

        // actions
        switchSession,
        startRename,
        cancelRename,
    }
}