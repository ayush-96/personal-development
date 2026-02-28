import {
    PromptInput,
    PromptInputButton,
    PromptInputModelSelect,
    PromptInputModelSelectContent,
    PromptInputModelSelectItem,
    PromptInputModelSelectTrigger,
    PromptInputModelSelectValue,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
} from '@/components/ui/shadcn-io/ai/prompt-input'
import { PaperclipIcon } from 'lucide-react'

export type ChatModel = {
    id: string
    name: string
    disabled?: boolean
    disabledReason?: string
}

type ChatInputProps = {
    value: string
    onChange: (v: string) => void
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void

    models: ChatModel[]
    selectedModel: string
    onModelChange: (v: string) => void

    disabled?: boolean
}

export function ChatInput({
    value,
    onChange,
    onSubmit,
    models,
    selectedModel,
    onModelChange,
    disabled,
}: ChatInputProps) {
    return (
        <div className="border-t p-4">
            <PromptInput onSubmit={onSubmit}>
                <PromptInputTextarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Ask me anything…"
                    disabled={disabled}
                />

                <PromptInputToolbar>
                    <PromptInputTools>
                        <PromptInputButton disabled={disabled}>
                            <PaperclipIcon size={16} />
                        </PromptInputButton>

                        <PromptInputModelSelect
                            value={selectedModel}
                            onValueChange={onModelChange}
                            disabled={disabled}
                        >
                            <PromptInputModelSelectTrigger>
                                <PromptInputModelSelectValue />
                            </PromptInputModelSelectTrigger>
                            <PromptInputModelSelectContent>
                                {models.map((m) => (
                                    <PromptInputModelSelectItem
                                        key={m.id}
                                        value={m.id}
                                        disabled={m.disabled}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{m.name}</span>
                                            {m.disabled && (
                                                <span className="text-xs text-muted-foreground">
                                                    {m.disabledReason ?? 'Unavailable'}
                                                </span>
                                            )}
                                        </div>
                                    </PromptInputModelSelectItem>
                                ))}
                            </PromptInputModelSelectContent>
                        </PromptInputModelSelect>
                    </PromptInputTools>

                    <PromptInputSubmit disabled={disabled || !value.trim()} />
                </PromptInputToolbar>
            </PromptInput>
        </div>
    )
}