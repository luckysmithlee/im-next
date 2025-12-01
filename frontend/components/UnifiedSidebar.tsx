import { useMemo, useRef, useEffect, useState } from 'react'
import { X, Pin, MoreVertical } from 'lucide-react'

type Conversation = { peer: string; unread?: number; pinned?: boolean; pinnedAt?: number; lastTs?: number; lastActive?: number }

type Props = {
  conversations: Conversation[]
  unreadByPeer: Record<string, number>
  to: string
  onSelectPeer: (peer: string) => void
  showSidebar: boolean
  setShowSidebar: (v: boolean) => void
  totalUnread: number
  onPin: (peer: string, pinned: boolean) => void
  onDelete: (peer: string) => void
}

export default function UnifiedSidebar({ conversations, unreadByPeer, to, onSelectPeer, showSidebar, setShowSidebar, totalUnread, onPin, onDelete }: Props) {
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const [sidebarHeight, setSidebarHeight] = useState(0)
  const [sidebarScrollTop, setSidebarScrollTop] = useState(0)
  const ROW_HEIGHT = 60
  const [openMenuPeer, setOpenMenuPeer] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function updateSize() { if (sidebarRef.current) setSidebarHeight(sidebarRef.current.clientHeight) }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => { window.removeEventListener('resize', updateSize) }
  }, [])
  const convTotal = conversations.length
  const visibleCount = sidebarHeight ? Math.ceil(sidebarHeight / ROW_HEIGHT) + 6 : 20
  const startIndex = Math.max(0, Math.floor(sidebarScrollTop / ROW_HEIGHT) - 3)
  const endIndex = Math.min(convTotal, startIndex + visibleCount)
  const convSlice = useMemo(() => conversations.slice(startIndex, endIndex), [conversations, startIndex, endIndex])
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!openMenuPeer) return
      const el = menuRef.current
      if (el && !el.contains(e.target as Node)) setOpenMenuPeer(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenuPeer(null)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenuPeer])
  return (
    <aside className={`${showSidebar ? 'flex' : 'hidden lg:flex'} w-64 bg-elevated border-r border-border flex-col absolute lg:relative inset-y-0 left-0 z-10 lg:z-auto h-full`}>
      <div className="px-4 sm:px-6 py-4 border-b border-border flex-shrink-0 h-[76px] flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-text truncate">会话列表{totalUnread > 0 ? ` · 未读 ${totalUnread}` : ''}</h2>
            </div>
          </div>
          <button onClick={() => setShowSidebar(false)} className="lg:hidden p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0" aria-label="关闭侧边栏">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" ref={sidebarRef} onScroll={(e) => setSidebarScrollTop((e.target as HTMLDivElement).scrollTop)}>
        {conversations.length === 0 ? (
          <div className="text-xs text-text-muted px-3 py-2">暂无会话</div>
        ) : (
          <div style={{ height: convTotal * ROW_HEIGHT, position: 'relative' }}>
            <div style={{ transform: `translateY(${startIndex * ROW_HEIGHT}px)` }}>
              {convSlice.map((c) => (
                <div
                  key={c.peer}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectPeer(c.peer)}
                  className={`w-full p-3 rounded-lg text-sm transition-all duration-200 flex items-center cursor-pointer relative ${to === c.peer ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-300 dark:border-primary-700 shadow-sm' : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-text-muted hover:text-text hover:shadow-sm'}`}
                  style={{ height: ROW_HEIGHT }}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="font-medium truncate flex-1">{c.peer}</span>
                    {c.pinned && <Pin className="w-4 h-4 text-primary-500 ml-2" />}
                    {(unreadByPeer[c.peer] || 0) > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white flex-shrink-0">{unreadByPeer[c.peer]}</span>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenuPeer(openMenuPeer === c.peer ? null : c.peer) }} className="ml-2 p-2 rounded-md border hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-haspopup="menu" aria-expanded={openMenuPeer === c.peer} aria-label="更多">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuPeer === c.peer && (
                    <div ref={menuRef} role="menu" className="absolute right-2 top-1/2 -translate-y-1/2 bg-elevated border border-border rounded-md shadow-lg z-40 min-w-[160px] py-1">
                      <button role="menuitem" className="block w-full text-left px-3 py-2 text-sm hover:bg-surface-100 focus:outline-none focus:bg-surface-100" onClick={(e) => { e.stopPropagation(); if (sidebarRef.current) sidebarRef.current.scrollTo({ top: 0, behavior: 'smooth' }); onPin(c.peer, !c.pinned); setOpenMenuPeer(null) }}>{c.pinned ? '取消置顶' : '置顶'}</button>
                      <button role="menuitem" className="block w-full text-left px-3 py-2 text-sm hover:bg-surface-100 focus:outline-none focus:bg-surface-100" onClick={(e) => { e.stopPropagation(); onDelete(c.peer); setOpenMenuPeer(null) }}>删除</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
