import { cn } from '@/lib/utils'

interface Props {
  role:      'user' | 'ai'
  content:   string
  isTyping?: boolean
}

export default function ChatBubble({ role, content, isTyping }: Props) {
  const isUser = role === 'user'

  if (isTyping) {
    return (
      <div className="flex items-end gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center text-white text-xs flex-shrink-0">
          AI
        </div>
        <div className="bg-white rounded-2xl rounded-bl-sm border border-gray-100 shadow-card px-4 py-3">
          <div className="flex items-center gap-1.5 h-5">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-end gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
        isUser ? 'bg-accent text-white' : 'bg-primary-700 text-white',
      )}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-primary-700 text-white rounded-br-sm'
          : 'bg-white border border-gray-100 shadow-card text-slate-700 rounded-bl-sm',
      )}>
        {/* Light markdown: bold, bullets, newlines */}
        {content.split('\n').map((line, i) => {
          const bullet = /^\s*[-*•]\s+/.test(line)
          const text   = bullet ? line.replace(/^\s*[-*•]\s+/, '') : line
          const parts  = text.split(/(\*\*[^*]+\*\*)/g)
          const inline = parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} className={isUser ? 'text-white' : 'text-slate-900'}>{part.slice(2, -2)}</strong>
              : <span key={j}>{part}</span>,
          )
          if (bullet) {
            return (
              <div key={i} className={`flex gap-2 ${i > 0 ? 'mt-1' : ''}`}>
                <span className={isUser ? 'text-white' : 'text-primary-500'}>•</span>
                <span className="flex-1">{inline}</span>
              </div>
            )
          }
          return <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{inline}</p>
        })}
      </div>
    </div>
  )
}
