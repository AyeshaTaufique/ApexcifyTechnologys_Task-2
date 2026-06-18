import React from 'react';
import { Home, Compass, User as UserIcon, LogOut, PlusSquare, Sparkles } from 'lucide-react';
import { ActiveScreen, User } from '../types';

interface NavigationProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenCreatePost: () => void;
}

export default function Navigation({
  activeScreen,
  setActiveScreen,
  currentUser,
  onLogout,
  onOpenCreatePost,
}: NavigationProps) {
  if (!currentUser) return null;

  const navItems = [
    { id: 'feed' as ActiveScreen, label: 'Feed', icon: Home },
    { id: 'discover' as ActiveScreen, label: 'Discover', icon: Compass },
    { id: 'profile' as ActiveScreen, label: 'Profile', icon: UserIcon },
  ];

  return (
    <>
      {/* Desktop Left Sidebar navigation */}
      <aside className="hidden md:flex flex-col justify-between w-64 h-screen sticky top-0 border-r border-slate-200 bg-white p-6 select-none z-10" id="desktop-sidebar">
        <div className="flex flex-col gap-8">
          {/* Logo Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer py-1"
            onClick={() => setActiveScreen('feed')}
            id="brand-logo"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5.2 h-5.2 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-[18px] tracking-tight text-slate-900 leading-none">VibeNet</h1>
              <span className="text-[11px] font-mono font-medium text-indigo-500 uppercase tracking-widest leading-none">Social Hub</span>
            </div>
          </div>

          {/* Quick User summary in Nav */}
          <div 
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
            onClick={() => setActiveScreen('profile')}
            id="sidebar-user-summary"
          >
            <img 
              src={currentUser.profileImage} 
              alt={currentUser.fullName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-50"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <p className="font-medium text-sm text-slate-800 truncate leading-tight">{currentUser.fullName}</p>
              <p className="text-xs text-slate-400 truncate font-mono">@{currentUser.username}</p>
            </div>
          </div>

          {/* Nav Items list */}
          <nav className="flex flex-col gap-1" id="desktop-nav-menu">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveScreen(item.id)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <IconComponent className={`w-[20px] h-[20px] transition-transform group-hover:scale-105 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Create Post Action inside sidebar */}
            <button
              id="sidebar-create-post-btn"
              onClick={onOpenCreatePost}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm shadow-md shadow-indigo-200 transition-all cursor-pointer hover:-translate-y-[1px] active:translate-y-[1px]"
            >
              <PlusSquare className="w-5 h-5" />
              <span>Create Post</span>
            </button>
          </nav>
        </div>

        {/* Footer Logout button */}
        <div className="pt-4 border-t border-slate-100" id="sidebar-footer">
          <button
            id="nav-logout-btn"
            onClick={onLogout}
            className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer group"
          >
            <LogOut className="w-[18px] h-[18px] text-slate-400 group-hover:text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation Bar */}
      <header className="flex md:hidden justify-between items-center px-4 py-3.5 sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-150 select-none z-10" id="mobile-header">
        <div className="flex items-center gap-2.5" onClick={() => setActiveScreen('feed')}>
          <div className="flex items-center justify-center w-8.5 h-8.5 rounded-lg bg-indigo-600 text-white">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <span className="font-display font-bold text-[16px] text-slate-900 tracking-tight">VibeNet</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="mobile-header-create-post-btn"
            onClick={onOpenCreatePost}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 active:bg-indigo-100 transition-colors"
            title="Create Post"
          >
            <PlusSquare className="w-5 h-5" />
          </button>
          
          <button
            id="mobile-header-logout-btn"
            onClick={onLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 active:bg-slate-100 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>

          <img 
            src={currentUser.profileImage} 
            alt={currentUser.fullName}
            className="w-8.5 h-8.5 rounded-full object-cover ring-2 ring-indigo-50"
            onClick={() => setActiveScreen('profile')}
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="flex md:hidden justify-around items-center fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-150 py-2.5 px-6 select-none z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]" id="mobile-bottom-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-item-${item.id}`}
              onClick={() => setActiveScreen(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? 'text-indigo-600' : 'text-slate-400 active:text-slate-600'
              }`}
            >
              <IconComponent className="w-5.5 h-5.5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
