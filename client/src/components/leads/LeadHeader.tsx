import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import { GlobalSearchResult } from '../../types/hr';
import { Menu, User as UserIcon, LogOut, ChevronDown, Search, X, ArrowRight } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

interface LeadHeaderProps {
  user: User;
  department: LeadDepartment;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

interface TeamMemberLite {
  id: string;
  empId: string;
  name: string;
  email: string;
  jobTitle: string;
  status: string;
}

interface TeamAttendanceLite {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  status: string;
  clockIn: string | null;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const utcToday = (): string => new Date().toISOString().split('T')[0];

export const LeadHeader: React.FC<LeadHeaderProps> = ({
  user,
  department,
  onLogout,
  onOpenMobileMenu,
  currentRoute,
  onNavigate,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const teamCacheRef = useRef<TeamMemberLite[] | null>(null);
  const attendanceCacheRef = useRef<TeamAttendanceLite[] | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search — scoped to the lead's team (members + today's attendance)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        if (!teamCacheRef.current || !attendanceCacheRef.current) {
          const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
          const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
          const [teamRes, attRes] = await Promise.all([
            fetch(`/api/employees/team/${user.email}`, { headers }),
            fetch(`/api/attendance/team/${user.email}?date=${utcToday()}`, { headers }),
          ]);
          if (teamRes.ok) {
            const d = await teamRes.json();
            teamCacheRef.current = d.team || [];
          }
          if (attRes.ok) {
            const d = await attRes.json();
            attendanceCacheRef.current = d.team || [];
          }
        }

        const q = searchQuery.trim().toLowerCase();
        const results: GlobalSearchResult[] = [];

        (teamCacheRef.current || []).forEach((m) => {
          if (
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.empId.toLowerCase().includes(q) ||
            m.jobTitle.toLowerCase().includes(q)
          ) {
            results.push({
              id: m.id,
              category: 'Employees',
              title: m.name,
              subtitle: `${m.empId} • ${m.jobTitle}`,
              badge: m.status,
              linkRoute: '/lead/team',
            });
          }
        });

        (attendanceCacheRef.current || []).forEach((a) => {
          if (a.employeeName.toLowerCase().includes(q) || a.status.toLowerCase().includes(q)) {
            results.push({
              id: `att_${a.employeeId}`,
              category: 'Attendance',
              title: `${a.employeeName} — Today`,
              subtitle: `Status: ${a.status} | In: ${a.clockIn || '—'}`,
              badge: a.status,
              linkRoute: '/lead/attendance',
            });
          }
        });

        setSearchResults(results.slice(0, 8));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [searchQuery, user.email]);

  const handleSearchResultClick = (result: GlobalSearchResult) => {
    if (result.linkRoute) {
      onNavigate(result.linkRoute);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const pageTitle = currentRoute.split('/').pop() || 'dashboard';
  const capitalizedTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

  return (
    <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/70 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 sticky top-0" id="lead-header">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenMobileMenu} className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-colors focus:outline-none cursor-pointer" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">{capitalizedTitle}</h1>
          <p className="text-[11px] text-slate-500 font-medium">{department} Lead</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Team Search */}
        <div className="relative" ref={searchRef} id="lead-global-search-container">
          <div className="relative w-32 sm:w-56 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full text-xs font-medium rounded-xl py-1.5 pl-8 pr-7 bg-slate-100/70 border border-slate-200/80 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
              id="lead-global-search-input"
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

          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden z-50 animate-scaleUp border border-slate-200/80 shadow-xl"
              id="lead-global-search-results-menu"
            >
              <div className="p-3 border-b border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900">Search Results</span>
                <span className="font-mono text-[10px] text-slate-400">{searchResults.length} matches</span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-200/70 custom-scrollbar">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400">Searching team...</div>
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
                          <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100/60 text-slate-500 whitespace-nowrap">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-1" />
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">No matching team records found.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <NotificationBell onNavigate={onNavigate} />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/60 transition-colors focus:outline-none cursor-pointer"
            id="lead-profile-btn"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-500 font-medium">{user.jobTitle}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-xl py-2 z-50 animate-scaleUp">
              <div className="px-4 py-3 border-b border-slate-200/70">
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              </div>
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
