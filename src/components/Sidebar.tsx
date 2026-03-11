'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Home,
  Calendar,
  MessageCircle,
  Bot,
  CheckSquare,
  ShoppingCart,
  UtensilsCrossed,
  Megaphone,
  Shield,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  User,
} from 'lucide-react';
import { hasAccess } from '@/lib/roles';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home, feature: null },
  { href: '/chat', label: 'AI Chat', icon: MessageCircle, feature: 'chat' as const },
  { href: '/agents', label: 'Agents', icon: Bot, feature: 'agents' as const },
  { href: '/calendar', label: 'Calendar', icon: Calendar, feature: 'calendar' as const },
  { href: '/tasks', label: 'Tasks & Chores', icon: CheckSquare, feature: 'tasks' as const },
  { href: '/shopping', label: 'Shopping List', icon: ShoppingCart, feature: 'shopping' as const },
  { href: '/meals', label: 'Meal Planner', icon: UtensilsCrossed, feature: 'meals' as const },
  { href: '/bulletin', label: 'Bulletin Board', icon: Megaphone, feature: 'bulletin' as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!session?.user) return null;

  const user = session.user;
  const role = user.role || 'pending';

  const visibleNav = navItems.filter(
    (item) => !item.feature || hasAccess(role, item.feature)
  );

  const sidebarContent = (
    <>
      {/* Subtle gradient overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none" />

      {/* Family Name */}
      <div className="p-6 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">The Stephens</h1>
            <p className="text-xs text-sidebar-text/50 font-medium">Family Hub</p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-2 hover:bg-white/10 rounded-lg text-sidebar-text/50 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 overflow-auto relative z-10">
        <div className="space-y-1">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white shadow-sm'
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isActive ? 'bg-indigo-500/20' : ''
                }`}>
                  <Icon size={17} className={isActive ? 'text-indigo-400' : ''} />
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Admin section */}
        {role === 'superadmin' && (
          <>
            <div className="my-3 mx-3 border-t border-white/5" />
            <p className="px-3 text-[10px] uppercase tracking-widest text-sidebar-text/30 font-semibold mb-2">Admin</p>
            <div className="space-y-1">
              {[
                { href: '/admin', label: 'User Management', icon: Shield },
                { href: '/admin/ai-config', label: 'AI Configuration', icon: Settings },
              ].map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white shadow-sm'
                        : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-indigo-500/20' : ''
                    }`}>
                      <Icon size={17} className={isActive ? 'text-indigo-400' : ''} />
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Current User */}
      <div className="p-4 mx-3 mb-3 rounded-xl bg-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg"
            style={{ backgroundColor: user.color || '#6366f1' }}
          >
            {user.avatar || user.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-semibold truncate">{user.name}</p>
            <p className="text-[11px] text-sidebar-text/50 capitalize font-medium">{role}</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/profile"
              className="p-2 hover:bg-white/10 rounded-lg text-sidebar-text/40 hover:text-white transition-colors"
              title="Profile"
            >
              <User size={16} />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 hover:bg-white/10 rounded-lg text-sidebar-text/40 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-sidebar-bg text-white rounded-xl shadow-lg shadow-black/20"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] bg-sidebar-bg text-sidebar-text flex-col h-screen shrink-0 relative overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-sidebar-bg text-sidebar-text flex flex-col overflow-hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
