import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types/auth';
import { GlobalSearchResult, HRNotification } from '../../types/hr';
import { hrDashboardService } from '../../services/hrDashboardService';
import {
  Menu,
  Search,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  X,
  CheckCheck,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface HRHeaderProps {
  user: User;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const HRHeader: React.FC<HRHeaderProps> = ({
  user,
  onLogout,
  onOpenMobileMenu,
  currentRoute,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState<HRNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    hrDashboardService.getNotifications().then(setNotifications);
  }, []);

  // Handle Global Search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      hrDashboardService.searchGlobal(searchQuery).then((results) => {
        setSearchResults(results);
        setIsSearching(false);
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    await hrDashboardService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (notif: HRNotification) => {
    if (!notif.isRead) {
      await hrDashboardService.markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.actionUrl) {
      onNavigate(notif.actionUrl);
      setIsNotificationsOpen(false);
    }
  };

  const handleSearchResultClick = (result: GlobalSearchResult) => {
    if (result.linkRoute) {
      onNavigate(result.linkRoute);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const getPageTitle = () => {
    if (currentRoute === '/hr/dashboard' || currentRoute === '/' || !currentRoute) {
      return 'HR Dashboard';
    }
    if (currentRoute.includes('/employees')) return 'Employees';
    if (currentRoute.includes('/attendance')) return 'Attendance';
    if (currentRoute.includes('/leaves')) return 'Leaves';
    if (currentRoute.includes('/tickets')) return 'Tickets';
    if (currentRoute.includes('/reports')) return 'Reports';
    if (currentRoute.includes('/settings')) return 'Settings';
    return 'HR Dashboard';
  };

  return (
    <header
      className="h-14 bg-[#0d0e12] border-b border-white/5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20"
      id="hr-top-header"
    >
      {/* Left Section: Mobile Menu & Clean Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none cursor-pointer"
          aria-label="Open navigation drawer"
          id="mobile-drawer-toggle-btn"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-bold text-white tracking-tight" id="header-page-title">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Section: Search, Notification Bell, HR Admin Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative" ref={searchRef} id="global-search-container">
          <div className="relative w-36 sm:w-60 md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full text-xs font-normal rounded-xl py-1.5 pl-8 pr-7 bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              id="global-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121318] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-scaleUp text-slate-200"
              id="global-search-results-menu"
            >
              <div className="p-3 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white">Search Results</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {searchResults.length} matches
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Searching records...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={`${item.category}-${item.id}`}
                      type="button"
                      onClick={() => handleSearchResultClick(item)}
                      className="w-full p-3 text-left hover:bg-white/[0.04] transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-white/5 text-slate-400">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-1" />
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No matching records found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef} id="notifications-menu-container">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 relative transition-colors focus:outline-none cursor-pointer"
            aria-label={`Notifications (${unreadCount} unread)`}
            id="header-notification-bell-btn"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0d0e12]" />
            )}
          </button>

          {/* Notifications Panel */}
          {isNotificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121318] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-scaleUp text-slate-200"
              id="notifications-dropdown-panel"
            >
              <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 focus:outline-none cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 hover:bg-white/[0.04] transition-colors cursor-pointer flex items-start gap-2.5 ${
                        !notif.isRead ? 'bg-indigo-500/[0.04]' : ''
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          !notif.isRead ? 'bg-indigo-400' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-white truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {notif.timeAgo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* HR Admin Profile */}
        <div className="relative" ref={profileRef} id="user-profile-menu-container">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors focus:outline-none cursor-pointer"
            id="header-user-profile-btn"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              HA
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
              HR Admin
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-[#121318] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-scaleUp text-slate-200"
              id="header-user-profile-dropdown"
            >
              <div className="p-2.5 border-b border-white/5 mb-1">
                <div className="text-xs font-bold text-white">{user.name}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{user.email}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onNavigate('/hr/settings');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings</span>
              </button>

              <div className="my-1 border-t border-white/5" />

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                id="menu-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
