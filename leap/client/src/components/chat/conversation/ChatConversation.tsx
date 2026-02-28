import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from '@/components/ui/shadcn-io/ai/conversation'
import { Loader } from '@/components/ui/shadcn-io/ai/loader'
import {
    Message,
    MessageAvatar,
    MessageContent,
} from '@/components/ui/shadcn-io/ai/message'
import {
    Source,
    Sources,
    SourcesContent,
    SourcesTrigger,
} from '@/components/ui/shadcn-io/ai/source'

type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
    id: string
    role: ChatRole
    content: string
    isStreaming?: boolean
    sources?: { title: string; url: string }[]
}

type ChatConversationProps = {
    messages: ChatMessage[]
}

export function ChatConversation({ messages }: ChatConversationProps) {
    return (
        <Conversation className="flex-1">
            <ConversationContent className="space-y-4">
                {messages.map((m) => (
                    <div key={m.id} className="space-y-3">
                        <Message from={m.role}>
                            <MessageContent>
                                {m.isStreaming ? (
                                    <div className="flex items-center gap-2">
                                        <Loader size={14} />
                                        <span className="text-sm text-muted-foreground">
                                            Thinking...
                                        </span>
                                    </div>
                                ) : (
                                    m.content
                                )}
                            </MessageContent>
                            <MessageAvatar
                                src={
                                    m.role === 'user'
                                        ? 'https://github.com/dovazencot.png'
                                        : 'https://github.com/vercel.png'
                                }
                                name={m.role === 'user' ? 'User' : 'AI'}
                            />
                        </Message>

                        {/* Sources（可选） */}
                        {m.sources && m.sources.length > 0 && (
                            <div className="ml-10">
                                <Sources>
                                    <SourcesTrigger count={m.sources.length} />
                                    <SourcesContent>
                                        {m.sources.map((s, i) => (
                                            <Source key={i} href={s.url} title={s.title} />
                                        ))}
                                    </SourcesContent>
                                </Sources>
                            </div>
                        )}
                    </div>
                ))}
            </ConversationContent>

            <ConversationScrollButton />
        </Conversation>
    )
}