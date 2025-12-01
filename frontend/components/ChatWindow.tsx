import { MessageCircle, Send } from 'lucide-react';

type Props = {
  to: string;
  messages: any[];
  userId: string | null;
  loadingMore: boolean;
  loadError: boolean;
  cursorsTo?: number | null;
  chatBodyRef: React.RefObject<HTMLDivElement>;
  onScrollTopLoadMore: () => void;
  messageInputRef: React.RefObject<HTMLInputElement>;
  text: string;
  setText: (v: string) => void;
  onSend: () => void;
};

export default function ChatWindow({ to, messages, userId, loadingMore, loadError, cursorsTo, chatBodyRef, onScrollTopLoadMore, messageInputRef, text, setText, onSend }: Props) {
  return (
    <main className="flex-1 flex flex-col min-w-0 bg-surface dark:bg-surface-900">
      {to && (
        <div className="bg-elevated border-b border-border px-4 sm:px-6 flex-shrink-0 h-[76px] flex flex-col justify-center">
          <div className="flex itemscenter justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="mr-3 flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-text truncate"> {to}</h2>
                <div className="text-xs text-success">在线</div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div id="chat" ref={chatBodyRef} onScroll={() => {
        const el = chatBodyRef.current as HTMLDivElement | null;
        if (!el || !to || loadingMore) return;
        if (el.scrollTop <= 8 && cursorsTo) onScrollTopLoadMore();
      }} className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-on-scroll chat-scroll relative">
        {!to ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted">
            <div className="text-center max-w-sm">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-medium mb-2">选择用户开始聊天</h3>
              <p className="text-sm opacity-70">在左侧选择一个用户开始对话，体验即时通讯的便利</p>
            </div>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted">
            <div className="text-center max-w-sm">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-medium mb-2">暂无消息</h3>
              <p className="text-sm opacity-70">发送第一条消息，开启与 {to} 的对话</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {loadingMore && (
              <div className="flex justify-center">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-xs text-text-muted">加载中...</span>
              </div>
            )}
            {loadError && (
              <div className="flex justify-center">
                <button className="px-3 py-1 text-xs rounded-md border">加载失败，重试</button>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === userId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] sm:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                  m.from === userId ? 'bg-primary-500 text-white rounded-br-none' : 'bg-elevated text-text rounded-bl-none'
                }`}>
                  <div className="flex items-center text-xs mb-1 opacity-75">
                    <span className={`font-medium ${m.from === userId ? 'text-white' : 'text-text-muted'}`}>{m.from === userId ? '我' : m.from}</span>
                    <span className="mx-2">•</span>
                    <span className={m.from === userId ? 'text-white' : 'text-text-muted'}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex-shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="flex items-end space-x-2 sm:space-x-3">
          <div className="flex-1 relative">
            <div className={`min-h-[40px] sm:min-h-[44px] max-h-[120px] overflow-y-auto bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl transition-all duration-200 ${to ? 'focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500' : ''} ${!to ? 'opacity-75' : ''}`}>
              <input ref={messageInputRef} value={text} onChange={e => setText(e.target.value)} placeholder={to ? `发送消息给 ${to}...` : ''} disabled={!to} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent border-0 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 resize-none disabled:cursor-not-allowed" />
              {!to && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 opacity-60" />
                    <span>请先选择一个用户开始聊天</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button type="submit" disabled={!to || !text.trim()} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500 transition-all duration-200 transform hover:scale-105 active:scale-95 ${text.trim() && to ? 'shadow-lg hover:shadow-xl' : ''}`}> <Send className="w-4 h-4 sm:w-5 sm:h-5" /> </button>
        </form>
      </div>
    </main>
  );
}
