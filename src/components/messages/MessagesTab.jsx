import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Trash2, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useMessages } from '../../hooks/useMessages'
import { useActivity } from '../../hooks/useActivity'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import toast from 'react-hot-toast'

export default function MessagesTab({ projectId }) {
  const { messages, loading, fetchMessages, createMessage, deleteMessage } = useMessages()
  const { logActivity } = useActivity()
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [isInternal, setIsInternal] = useState(true)
  const messagesEndRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (projectId) fetchMessages(projectId)
  }, [projectId, fetchMessages])

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

    setSending(true)
    try {
      const msg = await createMessage({
        project_id: projectId,
        content: trimmed,
        is_internal: isInternal,
      })
      setContent('')
      await fetchMessages(projectId)

      // Log activity (fire-and-forget)
      logActivity({
        project_id: projectId,
        action: 'message_sent',
        entity_type: 'message',
        entity_id: msg?.id,
        details: `Sent ${isInternal ? 'internal' : 'external'} message`,
      })
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMessage(id)
      await fetchMessages(projectId)
      toast.success('Message deleted')
    } catch {
      toast.error('Failed to delete message')
    }
  }

  function formatTimestamp(dateStr) {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return ''
    }
  }

  if (loading && messages.length === 0) {
    return (
      <div className="bg-void-light border border-border rounded-xl">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-5 w-5 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-void-light border border-border rounded-xl flex flex-col" style={{ height: '600px' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-amber" />
          <h3 className="text-sm font-semibold text-white">Messages</h3>
          {messages.length > 0 && (
            <span className="text-xs text-white/30">{messages.length}</span>
          )}
        </div>
      </div>

      {/* Messages list */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="h-10 w-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No messages yet</p>
            <p className="text-xs text-white/20 mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className="group relative bg-surface/50 border border-border/50 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-amber">
                  {msg.sender_name}
                </span>
                {msg.is_internal && (
                  <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                    Internal
                  </Badge>
                )}
                <span className="text-[10px] text-white/20 ml-auto">
                  {formatTimestamp(msg.created_at)}
                </span>
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-danger transition-all cursor-pointer"
                  title="Delete message"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-sm text-white/70 whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t border-border p-4 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setIsInternal(!isInternal)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer ${
              isInternal
                ? 'bg-white/5 text-white/50 border border-border'
                : 'bg-amber/10 text-amber border border-amber/30'
            }`}
          >
            <Lock className="h-3 w-3" />
            {isInternal ? 'Internal' : 'External'}
          </button>
          <span className="text-[10px] text-white/20">
            {isInternal ? 'Only visible to team' : 'Visible to client'}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber/50 transition-colors"
            disabled={sending}
          />
          <Button
            type="submit"
            size="sm"
            loading={sending}
            disabled={!content.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
