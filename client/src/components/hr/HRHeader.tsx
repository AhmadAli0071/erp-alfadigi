import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types/auth';
import { GlobalSearchResult } from '../../types/hr';
import { hrDashboardService } from '../../services/hrDashboardService';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  Menu,
  Search,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  X,
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

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      className="h-14 shrink-0 mx-3 sm:mx-4 lg:mx-6 mt-3 sm:mt-4 px-3 sm:px-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] flex items-center justify-between z-20"
      id="hr-top-header"
    >
      {/* Left Section: Mobile Menu & Clean Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 focus:outline-none cursor-pointer"
          aria-label="Open navigation drawer"
          id="mobile-drawer-toggle-btn"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-bold text-slate-900 tracking-tight" id="header-page-title">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Section: Search, Notification Bell, HR Admin Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative" ref={searchRef} id="global-search-container">
          <div className="relative w-36 sm:w-60 md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full text-xs font-medium rounded-xl py-1.5 pl-8 pr-7 bg-slate-100/70 border border-slate-200/80 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
              id="global-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 glass-pop rounded-2xl overflow-hidden z-50 animate-scaleUp text-slate-700"
              id="global-search-results-menu"
            >
              <div className="p-3 border-b border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900">Search Results</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {searchResults.length} matches
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-200/70 custom-scrollbar">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Searching records...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={`${item.category}-${item.id}`}
                      type="button"
                      onClick={() => handleSearchResultClick(item)}
                      className="w-full p-3 text-left hover:bg-slate-100/50 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100/60 text-slate-500">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-1" />
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No matching records found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <NotificationBell onNavigate={onNavigate} />

        {/* HR Admin Profile */}
        <div className="relative" ref={profileRef} id="user-profile-menu-container">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200/70 bg-slate-50 hover:bg-slate-100/60 transition-colors focus:outline-none cursor-pointer"
            id="header-user-profile-btn"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              HA
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
              HR Admin
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-52 glass-pop rounded-2xl p-1.5 z-50 animate-scaleUp text-slate-700"
              id="header-user-profile-dropdown"
            >
              <div className="p-2.5 border-b border-slate-200/70 mb-1">
                <div className="text-xs font-bold text-slate-900">{user.name}</div>
                <div className="text-[10px] font-mono text-slate-500 truncate">{user.email}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onNavigate('/hr/settings');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition-colors text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Settings</span>
              </button>

              <div className="my-1 border-t border-slate-200/70" />

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                id="menu-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
