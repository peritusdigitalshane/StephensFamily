'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  MessageCircle,
  Bot,
  CheckSquare,
  ShoppingCart,
  UtensilsCrossed,
  Megaphone,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  RefreshCw,
  ClipboardList,
  Users,
} from 'lucide-react';
import { format, isToday, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { useToast } from '@/components/Toast';

interface Member { id: string; name: string; role: string; color: string; avatar: string; }
interface Event { id: string; title: string; date: string; time: string; endTime: string; memberId: string; category: string; }
interface Task { id: string; title: string; assignedTo: string; completed: boolean; }
interface ShoppingItem { id: string; name: string; quantity: string; checked: boolean; }
interface BulletinPost { id: string; title: string; content: string; author: string; pinned: boolean; category: string; createdAt: string; }

const quickLinks = [
  { href: '/chat', label: 'AI Chat', icon: MessageCircle, gradient: 'from-indigo-500 to-purple-600', desc: 'Ask anything' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, gradient: 'from-emerald-500 to-teal-600', desc: 'Family schedule' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, gradient: 'from-amber-500 to-orange-600', desc: 'Chores & to-dos' },
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart, gradient: 'from-pink-500 to-rose-600', desc: 'Shopping list' },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed, gradient: 'from-violet-500 to-purple-600', desc: 'Meal planning' },
  { href: '/agents', label: 'Agents', icon: Bot, gradient: 'from-cyan-500 to-blue-600', desc: 'Custom AI agents' },
  { href: '/bulletin', label: 'Bulletin', icon: Megaphone, gradient: 'from-red-500 to-rose-600', desc: 'Family board' },
];

export default function Dashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const safeJson = async (r: Response) => {
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : data.data ?? [];
    };
    const [m, e, t, s, p] = await Promise.all([
      fetch('/api/members').then(safeJson).catch(() => []),
      fetch('/api/calendar').then(safeJson).catch(() => []),
      fetch('/api/tasks').then(safeJson).catch(() => []),
      fetch('/api/shopping').then(safeJson).catch(() => []),
      fetch('/api/bulletin').then(safeJson).catch(() => []),
    ]);
    setMembers(m); setEvents(e); setTasks(t); setShopping(s); setPosts(p);
    setLoading(false);
    if (isRefresh) {
      setRefreshing(false);
      toast('Dashboard refreshed', 'success');
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const todayEvents = events.filter((e) => { try { return isToday(parseISO(e.date)); } catch { return false; } });
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const uncheckedShopping = shopping.filter((i) => !i.checked);
  const pinnedPosts = posts.filter((p) => p.pinned);

  // Weekly events count for stats
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekEvents = events.filter((e) => {
    try {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    } catch { return false; }
  });

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name || id;
  const getMemberColor = (id: string) => members.find((m) => m.id === id)?.color || '#64748b';

  const userName = session?.user?.name || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const dashboardCards = [
    { id: 'schedule', delay: 0 },
    { id: 'tasks', delay: 50 },
    { id: 'shopping', delay: 100 },
    { id: 'bulletin', delay: 150 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
              <Sparkles size={14} />
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </div>
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50"
              title="Refresh dashboard"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <h1 className="text-3xl font-bold mb-1">{greeting}, {userName}!</h1>
          <p className="text-white/70 text-sm">Here&apos;s what&apos;s happening with the Stephens family today.</p>
          <div className="flex gap-6 mt-6">
            {[
              { icon: Calendar, val: todayEvents.length, label: 'Events today' },
              { icon: CheckSquare, val: pendingTasks.length, label: 'Tasks pending' },
              { icon: TrendingUp, val: completedTasks.length, label: 'Completed' },
              { icon: ShoppingCart, val: uncheckedShopping.length, label: 'To buy' },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Icon size={14} /></div>
                <div><p className="text-lg font-bold">{val}</p><p className="text-[11px] text-white/60">{label}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Calendar, val: weekEvents.length, label: 'Events this week', gradient: 'from-emerald-500/15 to-teal-500/15', border: 'border-emerald-500/20', iconColor: 'text-emerald-500' },
          { icon: ClipboardList, val: pendingTasks.length, label: 'Pending tasks', gradient: 'from-amber-500/15 to-orange-500/15', border: 'border-amber-500/20', iconColor: 'text-amber-500' },
          { icon: ShoppingCart, val: uncheckedShopping.length, label: 'Shopping items', gradient: 'from-pink-500/15 to-rose-500/15', border: 'border-pink-500/20', iconColor: 'text-pink-500' },
          { icon: Users, val: members.length, label: 'Family members', gradient: 'from-indigo-500/15 to-purple-500/15', border: 'border-indigo-500/20', iconColor: 'text-indigo-500' },
        ].map(({ icon: Icon, val, label, gradient, border, iconColor }, i) => (
          <div
            key={label}
            className={`animate-fade-in-up bg-gradient-to-br ${gradient} rounded-2xl border ${border} p-5 flex items-center gap-4`}
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
          >
            <div className={`w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0 ${iconColor}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{val}</p>
              <p className="text-xs text-text-muted font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8 ${loading ? 'animate-pulse' : ''}`}>
        {quickLinks.map((link, i) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="bg-surface rounded-2xl p-4 border border-border card-hover group text-center">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={18} className="text-white" />
              </div>
              <h3 className="font-semibold text-xs text-foreground">{link.label}</h3>
              <p className="text-[10px] text-text-muted mt-0.5">{link.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div
          className="bg-surface rounded-2xl border border-border p-6 card-hover animate-fade-in-up"
          style={{ animationDelay: `${dashboardCards[0].delay}ms`, animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Clock size={14} className="text-white" /></div>
              Today&apos;s Schedule
            </h2>
            <Link href="/calendar" className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight size={12} /></Link>
          </div>
          {todayEvents.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2"><Calendar size={20} className="text-emerald-400" /></div>
              <p className="text-text-muted text-sm mb-2">Nothing scheduled today. Plan something!</p>
              <Link href="/calendar" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                Open Calendar &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: getMemberColor(event.memberId) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-text-muted">{event.time} {event.endTime && `- ${event.endTime}`} &middot; {getMemberName(event.memberId)}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary capitalize shrink-0">{event.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div
          className="bg-surface rounded-2xl border border-border p-6 card-hover animate-fade-in-up"
          style={{ animationDelay: `${dashboardCards[1].delay}ms`, animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><CheckSquare size={14} className="text-white" /></div>
              Tasks & Chores
            </h2>
            <Link href="/tasks" className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight size={12} /></Link>
          </div>
          {pendingTasks.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2"><CheckSquare size={20} className="text-amber-400" /></div>
              <p className="text-text-muted text-sm mb-2">All caught up! Nice work.</p>
              <Link href="/tasks" className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                Manage Tasks &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getMemberColor(task.assignedTo) }} />
                  <p className="text-sm flex-1 truncate">{task.title}</p>
                  <span className="text-[11px] text-text-muted font-medium shrink-0">{getMemberName(task.assignedTo)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shopping */}
        <div
          className="bg-surface rounded-2xl border border-border p-6 card-hover animate-fade-in-up"
          style={{ animationDelay: `${dashboardCards[2].delay}ms`, animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center"><ShoppingCart size={14} className="text-white" /></div>
              Shopping List
            </h2>
            <Link href="/shopping" className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight size={12} /></Link>
          </div>
          {uncheckedShopping.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mx-auto mb-2"><ShoppingCart size={20} className="text-pink-400" /></div>
              <p className="text-text-muted text-sm mb-2">Shopping list is empty. Add items!</p>
              <Link href="/shopping" className="text-xs font-semibold text-pink-600 hover:text-pink-700 transition-colors">
                Open Shopping List &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {uncheckedShopping.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                  <p className="text-sm flex-1 truncate">{item.name}</p>
                  {item.quantity && <span className="text-[11px] text-text-muted bg-background px-2 py-0.5 rounded-full">{item.quantity}</span>}
                </div>
              ))}
              {uncheckedShopping.length > 5 && <p className="text-xs text-text-muted text-center pt-1">+{uncheckedShopping.length - 5} more</p>}
            </div>
          )}
        </div>

        {/* Bulletin */}
        <div
          className="bg-surface rounded-2xl border border-border p-6 card-hover animate-fade-in-up"
          style={{ animationDelay: `${dashboardCards[3].delay}ms`, animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center"><Megaphone size={14} className="text-white" /></div>
              Bulletin Board
            </h2>
            <Link href="/bulletin" className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight size={12} /></Link>
          </div>
          {posts.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-2"><Megaphone size={20} className="text-red-400" /></div>
              <p className="text-text-muted text-sm mb-2">No announcements yet. Post one!</p>
              <Link href="/bulletin" className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
                Go to Bulletin &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(pinnedPosts.length > 0 ? pinnedPosts : posts).slice(0, 3).map((post) => (
                <div key={post.id} className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1.5">
                    {post.pinned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Pinned</span>}
                    <span className="text-[10px] text-text-muted capitalize font-medium">{post.category}</span>
                  </div>
                  <p className="text-sm font-medium">{post.title}</p>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
