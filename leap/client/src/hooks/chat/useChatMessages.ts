import { useCallback, useEffect, useRef, useState } from 'react'
import { getSessionMessages, sendSessionMessage } from '../../api/chat'

type ApiResponse<T> = {
  code: string
  success: boolean
  message: string
  data: T
}

export type BackendMessage = {
  id: number
  session_id: number
  provider: string
  role: 'user' | 'assistant'
  content: string
  model?: string | null
  metadata?: any
  created_at: string
}

export function useChatMessages(sessionId?: number) {
  const [messages, setMessages] = useState<BackendMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reqIdRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setMessages([])
      return
    }

    const reqId = ++reqIdRef.current
    setLoading(true)
    setError(null)

    try {
      const res = (await getSessionMessages(sessionId)) as ApiResponse<BackendMessage[]>
      if (reqId !== reqIdRef.current) return
      setMessages(Array.isArray(res?.data) ? res.data : [])
    } catch (e: any) {
      if (reqId !== reqIdRef.current) return
      setError(e?.message ?? 'Failed to load messages')
      setMessages([])
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId) return
      const text = content?.trim()
      if (!text) return

      setSending(true)
      setError(null)

      try {
        const res = (await sendSessionMessage(sessionId, text)) as ApiResponse<{
          userMessage: BackendMessage
          assistantMessage: BackendMessage
        }>

        // 后端是一次返回 userMessage + assistantMessage
        const userMsg = res?.data?.userMessage
        const assistantMsg = res?.data?.assistantMessage

        setMessages((prev) => {
          const next = [...prev]
          if (userMsg) next.push(userMsg)
          if (assistantMsg) next.push(assistantMsg)
          return next
        })
      } catch (e: any) {
        setError(e?.message ?? 'Failed to send message')
      } finally {
        setSending(false)
      }
    },
    [sessionId],
  )

  return {
    messages,      // ✅ 永远是数组
    setMessages,

    loading,
    sending,
    error,

    refresh,
    sendMessage,
  }
}