import {
    ClockIcon,
    Pencil,
    Trash2,
    Check,
    X,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ChatSession, ChatOverview } from './useSessions'

type SessionSwitcherProps = {
    sessions: ChatSession[]
    currentSessionId?: number
    editingSessionId: number | null
    editingTitle: string

    onSwitch: (id: number) => void
    onStartRename: (id: number, title: string) => void
    onCancelRename: () => void
    onSaveRename: () => void
    onDelete: (id: number) => void

    setEditingTitle: (v: string) => void
}

export function SessionSwitcher({
    sessions,
    currentSessionId,
    editingSessionId,
    editingTitle,

    onSwitch,
    onStartRename,
    onCancelRename,
    onSaveRename,
    onDelete,

    setEditingTitle,
}: SessionSwitcherProps) {
    return (
        <DropdownMenu onOpenChange={(o) => !o && onCancelRename()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                    <ClockIcon className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[320px]">
                <DropdownMenuLabel>Sessions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <ScrollArea className="max-h-[300px]">
                    {sessions.map((s) => {
                        const isActive = s.id === currentSessionId
                        const isEditing = s.id === editingSessionId

                        return (
                            <div
                                key={s.id}
                                className={cn(
                                    'group mx-1 flex items-center rounded-md px-2 py-2',
                                    isActive ? 'bg-accent' : 'hover:bg-muted/60',
                                )}
                            >
                                <div
                                    className="flex-1 truncate text-sm"
                                    onClick={() => !isEditing && onSwitch(s.id)}
                                >
                                    {isEditing ? (
                                        <Input
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            className="h-8"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') onSaveRename()
                                                if (e.key === 'Escape') onCancelRename()
                                            }}
                                        />
                                    ) : (
                                        <span className={cn(isActive && 'font-medium')}>
                                            {s.title}
                                        </span>
                                    )}
                                </div>

                                {!isEditing && (
                                    <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => onStartRename(s.id, s.title)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => onDelete(s.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="ml-2 flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={onSaveRename}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={onCancelRename}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}