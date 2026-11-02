import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import client from '../api/client';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = useCallback(() => {
    client
      .get('/notifications')
      .then((res) => {
        setItems(res.data.notifications);
        setUnread(res.data.unreadCount);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const openItem = async (n) => {
    if (!n.read) {
      await client.put(`/notifications/${n._id}/read`).catch(() => {});
      load();
    }
    setOpen(false);
    navigate(n.link || '/');
  };

  const markAll = async () => {
    await client.put('/notifications/read-all').catch(() => {});
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
          open 
            ? 'border-primary-400 bg-primary-50 text-primary-700 shadow-xs' 
            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs animate-bounce">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-88 max-w-[calc(100vw-2rem)] card shadow-xl z-50 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button 
                onClick={markAll} 
                className="text-xs text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-600">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No unread alerts or notifications.</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                    n.read ? 'opacity-70 bg-white' : 'bg-primary-50/40'
                  }`}
                >
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    n.read ? 'bg-transparent' : 'bg-rose-500'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 leading-snug">{n.title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      {new Date(n.createdAt).toLocaleString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 self-center" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
