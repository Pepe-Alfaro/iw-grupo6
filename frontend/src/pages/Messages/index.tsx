import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, ArrowLeft, MessageCircle } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { BottomNav } from '../../components/layout/BottomNav'
import { useToast } from '../../components/ui/Toast'
import { messagesApi } from '../../api/messagesApi'
import type { ConversationWithMeta } from '../../api/messagesApi'
import { useAuthStore } from '../../store/authStore'
import { fmtRelative } from '../../utils/format'
import type { Message } from '../../types'

// ─── Avatar initial ───────────────────────────────────────────────────────────
function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  return (
    <span
      className={`rounded-full bg-brand text-white font-bold flex items-center justify-center flex-none`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px`, fontSize: `${size * 1.5}px` }}
    >
      {name[0].toUpperCase()}
    </span>
  )
}

// ─── Conversation row ─────────────────────────────────────────────────────────
function ConvRow({
  conv, active, onClick,
}: { conv: ConversationWithMeta; active: boolean; onClick: () => void }) {
  const name = conv.other_user?.full_name ?? 'Usuario'
  const lastMsg = conv.last_message?.content ?? 'Sin mensajes'
  const time = conv.last_message?.sent_at ? fmtRelative(conv.last_message.sent_at) : ''

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        ${active ? 'bg-brand-tint border-r-2 border-brand' : 'hover:bg-ink-50'}`}
    >
      <Avatar name={name} size={10} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-semibold text-ink-900 truncate">{name}</span>
          <span className="text-[11px] text-ink-400 flex-none">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[12px] text-ink-600 truncate">{lastMsg}</p>
          {(conv.unread_count ?? 0) > 0 && (
            <span className="flex-none w-4 h-4 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
              {conv.unread_count}
            </span>
          )}
        </div>
        {conv.product_title && (
          <p className="text-[11px] text-brand truncate mt-0.5">{conv.product_title}</p>
        )}
      </div>
    </button>
  )
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function Bubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed
          ${isMine
            ? 'bg-brand text-white rounded-br-sm'
            : 'bg-ink-100 text-ink-900 rounded-bl-sm'}`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/60' : 'text-ink-400'}`}>
          {fmtRelative(msg.sent_at)}
        </p>
      </div>
    </div>
  )
}

// ─── Chat thread ──────────────────────────────────────────────────────────────
function ChatThread({
  conv, currentUserId, onBack,
}: { conv: ConversationWithMeta; currentUserId: number; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const name = conv.other_user?.full_name ?? 'Usuario'

  const toast = useToast()

  useEffect(() => {
    messagesApi.listMessages(conv.id)
      .then((r) => setMessages(r.data))
      .catch(() => toast({ kind: 'error', title: 'Error al cargar mensajes' }))
    messagesApi.markRead(conv.id).catch(() => null)
  }, [conv.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const { data } = await messagesApi.sendMessage(conv.id, content)
      setMessages((prev) => [...prev, data])
      setInput('')
    } catch {
      toast({ kind: 'error', title: 'Error al enviar el mensaje' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-200 bg-white">
        <button onClick={onBack} className="md:hidden mr-1 text-ink-600 hover:text-ink-900">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <Avatar name={name} size={9} />
        <div>
          <p className="font-semibold text-ink-900 text-[14px]">{name}</p>
          {conv.product_title && (
            <p className="text-[12px] text-brand truncate max-w-[240px]">{conv.product_title}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-ink-50">
        {messages.length === 0 && (
          <div className="text-center py-12 text-ink-400 text-[13px]">
            Inicia la conversación
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} isMine={m.sender_id === currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex items-end gap-2 px-4 py-3 bg-white border-t border-ink-200">
        <textarea
          rows={1}
          placeholder="Escribe un mensaje…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as unknown as React.FormEvent) }
          }}
          className="flex-1 resize-none border border-ink-200 rounded-2xl px-4 py-2.5 text-[14px] outline-none focus:border-brand transition-colors max-h-32 overflow-y-auto"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-40 hover:brightness-95 transition flex-none"
        >
          <Send size={16} strokeWidth={1.5} />
        </button>
      </form>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Messages() {
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [convs, setConvs] = useState<ConversationWithMeta[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  useEffect(() => {
    messagesApi.listConversations()
      .then((r) => {
        setConvs(r.data)
        const qId = searchParams.get('conv')
        if (qId) {
          setActiveId(Number(qId))
          setMobileShowChat(true)
        }
      })
      .catch(() => toast({ kind: 'error', title: 'Error al cargar conversaciones' }))
      .finally(() => setLoading(false))
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeConv = convs.find((c) => c.id === activeId)

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-ink-600">Inicia sesión para ver tus mensajes</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full md:px-8 md:py-6 overflow-hidden">
        <div className="flex h-[calc(100vh-64px-56px)] md:h-[calc(100vh-64px-48px)] md:rounded-card md:border md:border-ink-200 md:shadow-card overflow-hidden bg-white">

          {/* Left: conversation list */}
          <div className={`w-full md:w-[320px] flex-none border-r border-ink-200 flex flex-col
            ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="px-4 py-4 border-b border-ink-200">
              <h2 className="text-[16px] font-bold text-ink-900">Mensajes</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="skeleton w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-24 rounded" />
                        <div className="skeleton h-2.5 w-36 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : convs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center px-4">
                  <MessageCircle size={40} strokeWidth={1} className="text-ink-300" />
                  <p className="text-ink-600 text-[13px]">
                    Aún no tienes mensajes.<br />Contacta con un vendedor desde el producto.
                  </p>
                </div>
              ) : (
                convs.map((conv) => (
                  <ConvRow
                    key={conv.id}
                    conv={conv}
                    active={conv.id === activeId}
                    onClick={() => {
                      setActiveId(conv.id)
                      setMobileShowChat(true)
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: chat thread */}
          <div className={`flex-1 ${!mobileShowChat ? 'hidden md:flex' : 'flex'} flex-col`}>
            {activeConv ? (
              <ChatThread
                conv={activeConv}
                currentUserId={user.id}
                onBack={() => setMobileShowChat(false)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-400">
                <MessageCircle size={48} strokeWidth={1} />
                <p className="text-[14px]">Selecciona una conversación</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="md:hidden"><BottomNav /></div>
    </div>
  )
}
