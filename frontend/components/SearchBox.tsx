import { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { ChatApi } from '../lib/api';

type Props = { token: string | null; onSelect: (userId: string) => void };

export default function SearchBox({ token, onSelect }: Props) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sel, setSel] = useState(-1);
  const timerRef = useRef<any>(null);
  const cacheRef = useRef<Map<string, { users: any[]; total: number; pageSize: number; ts: number }>>(new Map());
  const apiRef = useRef<ChatApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  if (token && !apiRef.current) apiRef.current = new ChatApi(token);

  async function search(q: string, pg = 1) {
    if (!apiRef.current) return;
    setLoading(true);
    let data;
    const cached = cacheRef.current.get(q);
    if (pg === 1 && cached && Date.now() - cached.ts < 30000) {
      data = { users: cached.users, total: cached.total, page: 1, pageSize: cached.pageSize };
    } else {
      data = await apiRef.current.searchUsers(q, pg, 8);
      if (pg === 1 && data) cacheRef.current.set(q, { users: (data.users || []), total: data.total || 0, pageSize: data.pageSize || 8, ts: Date.now() });
    }
    const list = (data && data.users) || [];
    setResults(pg === 1 ? list : [...results, ...list]);
    setPage(pg);
    setHasMore(((data?.page || pg) * (data?.pageSize || 8)) < (data?.total || 0));
    setLoading(false);
  }
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (open && !el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={containerRef} className="relative max-w-xl mx-auto">
      <div className="flex items-center bg-white/10 backdrop-blur rounded-lg px-3 py-2">
        <Search className="w-4 h-4 mr-2 opacity-80" />
        <input
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            setOpen(true);
            setSel(-1);
            if (timerRef.current) clearTimeout(timerRef.current);
            if (!v.trim()) { setResults([]); setHasMore(false); setLoading(false); return; }
            timerRef.current = setTimeout(() => search(v.trim(), 1), 300);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={async (e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              const next = Math.min((results.length - 1), sel + 1);
              setSel(next);
              if (next + 1 >= results.length && hasMore && !loading) await search(text.trim(), page + 1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              const prev = Math.max(-1, sel - 1);
              setSel(prev);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const idx = sel >= 0 ? sel : 0;
              const item = results[idx];
              if (item && item.id) { onSelect(item.id); setOpen(false); }
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder="搜索用户..."
          className="flex-1 bg-transparent border-0 text-sm text-white placeholder-white/70 focus:outline-none"
        />
        {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
      </div>
      {open && (
        <div role="listbox" className="absolute left-0 right-0 mt-2 bg-elevated border border-border rounded-lg shadow-lg max-h-64 overflow-auto z-20">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-text-muted">无匹配用户</div>
          ) : (
            results.map((u, i) => (
              <button
                key={`${u.id}_${i}`}
                onClick={() => { onSelect(u.id); setOpen(false); }}
                role="option"
                aria-selected={i === sel}
                className={`w-full px-3 py-2 text-left flex items-center ${i === sel ? 'bg-surface-100 dark:bg-surface-800' : ''}`}
              >
                <div className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center mr-3 text-xs">
                  {(u.nickname || u.email || u.id).slice(0,1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{u.nickname || u.email || u.id}</div>
                  <div className="text-xs text-text-muted truncate">{u.email} · {u.id}</div>
                </div>
              </button>
            ))
          )}
          {loading && (
            <div className="px-4 py-2 text-sm text-text-muted flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" />加载中...</div>
          )}
        </div>
      )}
    </div>
  );
}
