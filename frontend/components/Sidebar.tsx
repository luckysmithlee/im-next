type HistoryItem = { peer: string } & Record<string, any>;

type Props = {
  onlineList: string[];
  historyList: HistoryItem[];
  unreadByPeer: Record<string, number>;
  to: string;
  collapseOnline: boolean;
  collapseHistory: boolean;
  setCollapseOnline: (v: boolean) => void;
  setCollapseHistory: (v: boolean) => void;
  onSelectPeer: (peer: string) => void;
  messageInputRef: React.RefObject<HTMLInputElement>;
  showSidebar: boolean;
  setShowSidebar: (v: boolean) => void;
  stableOnline: string[];
};

export default function Sidebar({ onlineList, historyList, unreadByPeer, to, collapseOnline, collapseHistory, setCollapseOnline, setCollapseHistory, onSelectPeer, messageInputRef, showSidebar, setShowSidebar, stableOnline }: Props) {
  return (
    <aside className={`${showSidebar ? 'flex' : 'hidden lg:flex'} w-64 bg-elevated border-r border-border flex-col absolute lg:relative inset-y-0 left-0 z-10 lg:z-auto h-full`}>
      <div className="px-4 sm:px-6 py-4 border-b border-border flex-shrink-0 h-[76px] flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-text truncate">在线用户</h2>
            </div>
          </div>
          <button onClick={() => setShowSidebar(false)} className="lg:hidden p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0" aria-label="关闭侧边栏">✕</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2 border-b border-border">
          <button onClick={() => setCollapseOnline(!collapseOnline)} className="w-full flex items-center justify-between text-sm">
            <span>在线用户</span>
            <span>{collapseOnline ? '▶' : '▼'}</span>
          </button>
        </div>
        {!collapseOnline && (
          <div className="p-2 space-y-1">
            {onlineList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-text-muted px-4 py-8">
                <div className="w-12 h-12 mb-3 opacity-40">👤</div>
                <p className="text-sm text-center">暂无其他用户在线</p>
              </div>
            ) : (
              onlineList.map(u => (
                <button key={u} onClick={() => { onSelectPeer(u); if (typeof window !== 'undefined' && window.innerWidth < 1024) setShowSidebar(false); setTimeout(() => { if (messageInputRef.current) messageInputRef.current.focus(); }, 100); }} className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 flex items-center ${to === u ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-300 dark:border-primary-700 shadow-sm' : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-text-muted hover:text-text hover:shadow-sm'}`}>
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
                    </div>
                    <span className="font-medium truncate flex-1">{u}</span>
                    {to === u && (
                      <div className="ml-2 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        <div className="px-2 py-2 border-t border-border">
          <button onClick={() => setCollapseHistory(!collapseHistory)} className="w-full flex items-center justify-between text-sm">
            <span>历史会话</span>
            <span>{collapseHistory ? '▶' : '▼'}</span>
          </button>
        </div>
        {!collapseHistory && (
          <div className="p-2 space-y-1">
            {historyList.length === 0 ? (
              <div className="text-xs text-text-muted px-3 py-2">暂无历史会话</div>
            ) : (
              historyList.map((c) => (
                <div key={c.peer} role="button" tabIndex={0} onClick={() => { onSelectPeer(c.peer); if (typeof window !== 'undefined' && window.innerWidth < 1024) setShowSidebar(false); setTimeout(() => { if (messageInputRef.current) messageInputRef.current.focus(); }, 100); }} className={`w-full p-3 rounded-lg text-sm transition-all duration-200 flex items-center cursor-pointer ${to === c.peer ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-300 dark:border-primary-700 shadow-sm' : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-text-muted hover:text-text hover:shadow-sm'}`}>
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mr-3 ${stableOnline.includes(c.peer) ? 'bg-success' : 'bg-gray-400'}`}></div>
                    </div>
                    <span className="font-medium truncate flex-1">{c.peer}</span>
                    {unreadByPeer[c.peer] > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white flex-shrink-0">{unreadByPeer[c.peer]}</span>
                    )}
                    {to === c.peer && <div className="ml-2 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
