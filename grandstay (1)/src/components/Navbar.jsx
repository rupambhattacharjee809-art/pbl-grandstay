import React from 'react';
import { User, LogOut } from 'lucide-react';

export default function Navbar({
  activeView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  savedCount,
}) {
  const navItems = [
    { id: 'stays', label: 'Stays' },
    { id: 'villas', label: 'Private Villas' },
    { id: 'tours', label: 'Curated Tours' },
    { id: 'offers', label: 'Offers' },
    { id: 'mystays', label: savedCount > 0 ? `My Stays (${savedCount})` : 'My Stays' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onNavigate('stays')}
          className="font-display text-2xl font-semibold tracking-tight text-[#07111e] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d3557]"
        >
          GrandStay
        </button>

        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#0c1a2e] border-[#c59b27]'
                    : 'text-slate-600 border-transparent hover:text-[#0c1a2e] hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('mystays')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#0c1a2e] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <User size={14} />
                <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Sign out"
                title="Sign out"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0c1a2e] hover:bg-[#132742] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-5 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 py-1 ${
                isActive ? 'text-[#0c1a2e] underline decoration-[#c59b27] decoration-2 underline-offset-4' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
