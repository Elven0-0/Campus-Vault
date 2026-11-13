import React from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  Home,
  Lock,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { ActiveSection, InstitutionBranding } from '../types/academic';

interface NavbarAndSidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: (open: boolean) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  branding: InstitutionBranding;
  isAdminAuthenticated: boolean;
  counts: {
    questionPapers: number;
    labManuals: number;
    syllabi: number;
    studyMaterials: number;
  };
}

export const NAV_ITEMS: {
  id: ActiveSection;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'home', label: 'Academic Overview', shortLabel: 'Overview', icon: Home },
  {
    id: 'question_papers',
    label: 'Question Papers',
    shortLabel: 'Papers',
    icon: FileText,
  },
  {
    id: 'lab_manuals',
    label: 'Lab Manuals',
    shortLabel: 'Lab Manuals',
    icon: FlaskConical,
  },
  {
    id: 'syllabus',
    label: 'Syllabus Library',
    shortLabel: 'Syllabus',
    icon: BookOpen,
  },
];

export const TopHeaderBar: React.FC<NavbarAndSidebarProps> = ({
  activeSection,
  onSelectSection,
  onToggleMobileMenu,
  branding,
  isAdminAuthenticated,
}) => {
  // Strict 3-Zone Top Bar Contract:
  // Zone 1: Brand Title (one line) — Zone 2: 4-5 concise single-line nav links — Zone 3: 1 primary action
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      {/* Zone 1: Single-line Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onToggleMobileMenu(true)}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-600"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => onSelectSection('home')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-indigo-600 rounded"
        >
          {branding.hubName}
        </button>
      </div>

      {/* Zone 2: 5 concise single-line text navigation links */}
      <nav
        aria-label="Primary Navigation"
        className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {item.shortLabel}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 Primary Action Button */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={() => onSelectSection('admin')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
            activeSection === 'admin'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500'
          }`}
        >
          {isAdminAuthenticated ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Faculty / Admin Portal</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export const CollapsibleSidebar: React.FC<NavbarAndSidebarProps> = ({
  activeSection,
  onSelectSection,
  sidebarCollapsed,
  onToggleSidebar,
  mobileMenuOpen,
  onToggleMobileMenu,
  darkMode,
  onToggleDarkMode,
  branding,
  isAdminAuthenticated,
  counts,
}) => {
  const getCountForSection = (id: ActiveSection): number | null => {
    if (id === 'question_papers') return counts.questionPapers;
    if (id === 'lab_manuals') return counts.labManuals;
    if (id === 'syllabus') return counts.syllabi;
    return null;
  };

  return (
    <>
      {/* Desktop Collapsible Sidebar (Dark Navy / Charcoal University Theme) */}
      <aside
        aria-label="Academic Directory Sidebar"
        className={`hidden lg:flex flex-col shrink-0 bg-slate-950 text-slate-200 border-r border-slate-800/80 select-none transition-all duration-200 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Institution Header inside Sidebar */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
              {branding.logoMonogram}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate font-display">
                  {branding.hubName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {branding.defaultRegulation} Academic Hub
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          {!sidebarCollapsed && (
            <p className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400">
              Academic Libraries
            </p>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const count = getCountForSection(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!sidebarCollapsed && count !== null && (
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isActive ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            {!sidebarCollapsed && (
              <p className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400">
                Administration
              </p>
            )}
            <button
              type="button"
              onClick={() => onSelectSection('admin')}
              title={sidebarCollapsed ? 'Resource Management' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeSection === 'admin'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isAdminAuthenticated ? (
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 shrink-0 text-slate-400" />
                )}
                {!sidebarCollapsed && (
                  <span className="truncate">Resource Management</span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Theme Switch & Institution Info */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Light Surface' : 'Switch to Dark Surface'}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap"
          >
            <div className="flex items-center gap-2.5">
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              {!sidebarCollapsed && (
                <span>{darkMode ? 'Light Reading Mode' : 'Dark Reading Mode'}</span>
              )}
            </div>
          </button>

          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-[11px] text-slate-400 leading-relaxed">
              <p className="font-medium text-slate-300 truncate">
                {branding.institutionName}
              </p>
              <p className="truncate">{branding.supportEmail}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => onToggleMobileMenu(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[82vw] bg-slate-950 text-slate-100 h-full flex flex-col justify-between p-4 z-10 border-r border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {branding.logoMonogram}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-display">
                      {branding.hubName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                      {branding.institutionName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleMobileMenu(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  const count = getCountForSection(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectSection(item.id);
                        onToggleMobileMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </span>
                      {count !== null && (
                        <span className="text-xs font-mono tabular-nums text-slate-400">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    onSelectSection('admin');
                    onToggleMobileMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium mt-3 ${
                    activeSection === 'admin'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Lock className="w-4 h-4" />
                    <span>Admin Resource Portal</span>
                  </span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800"
              >
                <span className="flex items-center gap-2">
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  )}
                  <span>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </span>
              </button>
              <p className="text-[11px] text-slate-400 px-1">
                {branding.institutionName} · {branding.defaultRegulation}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
