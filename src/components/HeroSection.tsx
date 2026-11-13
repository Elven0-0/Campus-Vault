import React, { useRef, useState } from 'react';
import { ArrowRight, BookOpen, FileText, FlaskConical, Search, X } from 'lucide-react';
import {
  AcademicResource,
  ActiveSection,
  DepartmentInfo,
  InstitutionBranding,
} from '../types/academic';

interface HeroSectionProps {
  branding: InstitutionBranding;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectSection: (section: ActiveSection) => void;
  onQuickFilterDepartment: (deptCode: string) => void;
  onQuickFilterSemester: (sem: number) => void;
  onPreviewResource: (resource: AcademicResource) => void;
  departments: DepartmentInfo[];
  matchingSuggestions: AcademicResource[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  branding,
  searchQuery,
  onSearchChange,
  onSelectSection,
  onQuickFilterDepartment,
  onPreviewResource,
  departments,
  matchingSuggestions,
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    // Only apply on fine pointer devices (desktops)
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = heroRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800/80"
    >
      {/* Subtle Desktop-Only Cursor-Following Radial Light Effect */}
      {cursorPos && (
        <div
          aria-hidden="true"
          className="pointer-events-none hidden lg:block absolute inset-0 transition-opacity duration-200"
          style={{
            background: `radial-gradient(560px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(79, 70, 229, 0.16), transparent 70%)`,
          }}
        />
      )}

      {/* Subtle Architectural Grid Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-3xl">
          {/* Quiet 1-line Institutional Kicker (Unboxed typography, no pills) */}
          <p className="text-xs font-medium text-indigo-300 tracking-wide mb-3">
            SRM INSTITUTE OF SCIENCE &amp; TECHNOLOGY
          </p>

          {/* Main Display Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-white font-display leading-[1.15] [text-wrap:balance]">
            Your College Resources, All in One Place
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Access verified previous-year degree question papers, official laboratory
            manuals, and SRMIST curriculum syllabi for{' '}
            <span className="text-white font-medium">
              Calculus and Linear Algebra (26MAB1001T)
            </span>
            ,{' '}
            <span className="text-white font-medium">
              Programming for Problem Solving (26CSE1002J)
            </span>
            ,{' '}
            <span className="text-white font-medium">
              Electrical and Electronics Engineering (26EEE1001T)
            </span>
            , and{' '}
            <span className="text-white font-medium">
              Statistical and Quantum Physics (26PYB1001J)
            </span>
            .
          </p>

          {/* Prominent Global Search Bar */}
          <div className="mt-7 relative max-w-2xl">
            <div
              className={`flex items-center bg-slate-900/95 border rounded-xl transition-colors ${
                searchFocused
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'border-slate-700/90 hover:border-slate-600'
              }`}
            >
              <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by subject code (26MAB1001T, 26CSE1002J, 26EEE1001T, 26PYB1001J) or subject name..."
                aria-label="Global resource search"
                className="w-full bg-transparent px-3.5 py-3.5 text-sm sm:text-base text-white placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-2 mr-1 text-slate-400 hover:text-white rounded-lg"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const resultsEl = document.getElementById('global-search-results');
                  if (resultsEl) {
                    resultsEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="mr-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Search Vault
              </button>
            </div>

            {/* Instant Search Dropdown Preview when typing */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-30">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Instant Matches ({matchingSuggestions.length} found)
                  </span>
                  <span>Press Enter or click to preview</span>
                </div>
                {matchingSuggestions.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    No academic documents match “{searchQuery}”. Try searching by
                    subject code (26MAB1001T, 26CSE1002J, 26EEE1001T, 26PYB1001J) or subject name.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                    {matchingSuggestions.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onPreviewResource(item)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            <span className="font-mono text-indigo-400 mr-2">
                              {item.subjectCode}
                            </span>
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {item.department} · Semester {item.semester} ·{' '}
                            {item.regulation} · {item.fileFormat} (
                            {item.fileSizeFormatted})
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick-Access Subject Filter Strip (Functional interactive buttons) */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Quick Subject Filter:</span>
            {departments.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => onQuickFilterDepartment(dept.code)}
                className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {dept.shortName}
              </button>
            ))}
          </div>

          {/* Quick Section Navigation Shortcuts */}
          <div className="mt-7 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
            <button
              type="button"
              onClick={() => onSelectSection('question_papers')}
              className="inline-flex items-center gap-2 text-slate-200 hover:text-indigo-300 font-medium transition-colors whitespace-nowrap"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Browse Question Papers</span>
            </button>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <button
              type="button"
              onClick={() => onSelectSection('lab_manuals')}
              className="inline-flex items-center gap-2 text-slate-200 hover:text-indigo-300 font-medium transition-colors whitespace-nowrap"
            >
              <FlaskConical className="w-4 h-4 text-indigo-400" />
              <span>Explore Lab Manuals</span>
            </button>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <button
              type="button"
              onClick={() => onSelectSection('syllabus')}
              className="inline-flex items-center gap-2 text-slate-200 hover:text-indigo-300 font-medium transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Official Syllabi</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
