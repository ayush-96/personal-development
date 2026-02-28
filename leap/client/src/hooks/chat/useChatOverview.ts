import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getChatOverview, getRagflowStatus } from "../../api/chat"

type ApiResponse<T> = {
  code: string
  success: boolean
  message: string
  data: T
}

type AssistantOverviewSession = {
  id: number
  space_id: number
  title: string
  created_at: string
  updated_at: string
  isdeleted: number
}

type AssistantOverview = {
  assistantId: string | null
  status: string
  sessions: AssistantOverviewSession[]
}

export type ChatOverviewData = {
  spaceId: number
  assistants: Record<string, AssistantOverview>
}

type RagflowStatusData = {
  id: number
  spaceId: number
  assistantType: "RagFlow"
  assistantId: string | null
  status: string
  createdAt: string
  updatedAt: string
  enabled: boolean
}

type UseChatOverviewOptions = {
  pollRagflow?: boolean
  pollIntervalMs?: number
  fetchRagflowEvenIfOverviewFails?: boolean
}

export function useChatOverview(spaceId: number, options: UseChatOverviewOptions = {}) {
  const {
    pollRagflow = true,
    pollIntervalMs = 5000,
    fetchRagflowEvenIfOverviewFails = true,
  } = options

  const [overview, setOverview] = useState<ChatOverviewData | null>(null)
  const [ragflowStatus, setRagflowStatus] = useState<RagflowStatusData | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reqIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const reqId = ++reqIdRef.current
    setLoading(true)
    setError(null)

    try {
      // ✅ 注意：这里拿到的是 wrapper，需要取 .data
      const ovRes = (await getChatOverview(spaceId)) as ApiResponse<ChatOverviewData>
      if (reqId !== reqIdRef.current) return
      setOverview(ovRes.data)

      const rsRes = (await getRagflowStatus(spaceId)) as ApiResponse<RagflowStatusData>
      if (reqId !== reqIdRef.current) return
      setRagflowStatus(rsRes.data)

      // 可选：把 ragflowStatus 同步进 overview.assistants.RagFlow.status
      setOverview((prev) => {
        if (!prev) return prev
        const rag = prev.assistants?.RagFlow
        if (!rag) return prev
        if (rag.status === rsRes.data.status) return prev
        return {
          ...prev,
          assistants: {
            ...prev.assistants,
            RagFlow: { ...rag, status: rsRes.data.status },
          },
        }
      })
    } catch (e: any) {
      if (reqId !== reqIdRef.current) return
      setError(e?.message ?? "Failed to load chat overview")

      if (fetchRagflowEvenIfOverviewFails) {
        try {
          const rsRes = (await getRagflowStatus(spaceId)) as ApiResponse<RagflowStatusData>
          if (reqId !== reqIdRef.current) return
          setRagflowStatus(rsRes.data)
        } catch {
          // ignore
        }
      }
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }, [spaceId, fetchRagflowEvenIfOverviewFails])

  useEffect(() => {
    if (!spaceId) return
    refresh()
  }, [spaceId, refresh])

  // 轮询 RagFlow（当它非 ready）
  useEffect(() => {
    if (!pollRagflow) return
    if (!spaceId) return

    const status = ragflowStatus?.status ?? overview?.assistants?.RagFlow?.status
    if (!status) return
    if (status === "ready") return

    const timer = window.setInterval(async () => {
      try {
        const rsRes = (await getRagflowStatus(spaceId)) as ApiResponse<RagflowStatusData>
        setRagflowStatus(rsRes.data)

        setOverview((prev) => {
          if (!prev) return prev
          const rag = prev.assistants?.RagFlow
          if (!rag) return prev
          return {
            ...prev,
            assistants: {
              ...prev.assistants,
              RagFlow: { ...rag, status: rsRes.data.status },
            },
          }
        })
      } catch {
        // ignore
      }
    }, pollIntervalMs)

    return () => window.clearInterval(timer)
  }, [pollRagflow, pollIntervalMs, spaceId, ragflowStatus?.status, overview?.assistants?.RagFlow?.status])

  // ✅ 派生 assistantAvailability
  const assistantAvailability = useMemo(() => {
    const ov = overview?.assistants ?? {}
    const ragStatus = ragflowStatus?.status

    const result: Record<string, { status: string; ready: boolean }> = {}

    for (const key of Object.keys(ov)) {
      const s = ov[key]?.status
      result[key] = { status: s, ready: s === "ready" }
    }

    // 用 ragflowStatus 覆盖/兜底 RagFlow
    if (ragStatus) {
      result["RagFlow"] = { status: ragStatus, ready: ragStatus === "ready" }
    }

    return result
  }, [overview, ragflowStatus])

  return {
    overview,
    setOverview,

    ragflowStatus,
    setRagflowStatus,

    loading,
    error,
    refresh,

    assistantAvailability,
  }
}