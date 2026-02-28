import { useCallback, useState } from "react"
import {
  createChatSession,
  renameChatSession,
  deleteChatSession,
} from "../../api/chat"

// 你 create/rename 的返回里 session 字段基本一致
export type ChatSession = {
  id: number
  space_id: number
  user_id: number
  chat_assistant_id: number
  ragflow_session_id: string | null
  title: string
  created_at: string
  updated_at: string
  isdeleted: number
  // create 时还会有：assistantType、mode（可选）
  assistantType?: string
  mode?: string
}

type UseChatSessionsOptions = {
  /**
   * 每次成功后回调：由上层决定是否 refresh overview，或做乐观更新
   * action: "create" | "rename" | "delete"
   */
  onSuccess?: (payload: {
    action: "create" | "rename" | "delete"
    session?: ChatSession
    sessionId?: number
  }) => void

  onError?: (payload: {
    action: "create" | "rename" | "delete"
    error: unknown
  }) => void
}

export function useChatSessions(options: UseChatSessionsOptions = {}) {
  const { onSuccess, onError } = options

  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const createSession = useCallback(
    async (params: { spaceId: number; mode: string }) => {
      setCreating(true)
      setError(null)
      try {
        const res = await createChatSession(
          params.spaceId,
          params.mode,
        )
        // Response structure: { code, success, message, data: { session } }
        // Extract the data property to get the session object
        const session = (res?.data || res) as ChatSession

        onSuccess?.({ action: "create", session, sessionId: session.id })
        return session
      } catch (e: any) {
        setError(e?.message ?? "Failed to create session")
        onError?.({ action: "create", error: e })
        throw e
      } finally {
        setCreating(false)
      }
    },
    [onSuccess, onError],
  )

  const renameSession = useCallback(
    async (params: { sessionId: number; title: string }) => {
      const title = params.title.trim()
      if (!title) {
        const e = new Error("Title cannot be empty")
        setError(e.message)
        onError?.({ action: "rename", error: e })
        throw e
      }

      setRenaming(true)
      setError(null)
      try {
        const res = await renameChatSession(
          params.sessionId,
          title,
        )
        // Response structure: { code, success, message, data: { session } }
        // Extract the data property to get the session object
        const session = (res?.data || res) as ChatSession

        onSuccess?.({ action: "rename", session, sessionId: session.id })
        return session
      } catch (e: any) {
        setError(e?.message ?? "Failed to rename session")
        onError?.({ action: "rename", error: e })
        throw e
      } finally {
        setRenaming(false)
      }
    },
    [onSuccess, onError],
  )

  const removeSession = useCallback(
    async (sessionId: number) => {
      setDeleting(true)
      setError(null)
      try {
        await deleteChatSession(sessionId) // 你的 delete 返回 data: null
        onSuccess?.({ action: "delete", sessionId })
      } catch (e: any) {
        setError(e?.message ?? "Failed to delete session")
        onError?.({ action: "delete", error: e })
        throw e
      } finally {
        setDeleting(false)
      }
    },
    [onSuccess, onError],
  )

  return {
    creating,
    renaming,
    deleting,
    busy: creating || renaming || deleting,

    error,
    clearError,

    createSession,
    renameSession,
    deleteSession: removeSession,
  }
}