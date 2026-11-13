import React, { useState } from 'react';
import {
  Filter,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ActiveSection,
  DepartmentInfo,
  ResourceFilterState,
  SortOption,
} from '../types/academic';
import {
  ACADEMIC_YEARS,
  EXAM_TYPES,
  REGULATIONS,
  SEMESTERS,
  STUDY_MATERIAL_SUBTYPES,
} from '../data/sampleResources';

interface FilterToolbarProps {
  activeSection: ActiveSection;
  filters: ResourceFilterState;
  onUpdateFilter: <K extends keyof ResourceFilterState>(
    key: K,
    value: ResourceFilterState[K]
  ) => void;
  onResetFilters: () => void;
  departments: DepartmentInfo[];
  availableLabs: string[];
  totalMatching: number;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  activeSection,
  filters,
  onUpdateFilter,
  onResetFilters,
  departments,
  availableLabs,
  totalMatching,
  viewMode,
  onViewModeChange,
}) => {
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.department !== 'ALL' ||
    filters.semester !== 'ALL' ||
    filters.academicYear !== 'ALL' ||
    filters.regulation !== 'ALL' ||
    filters.examType !== 'ALL' ||
    filters.labName !== 'ALL' ||
    filters.materialSubType !== 'ALL' ||
    filters.syllabusStatus !== 'ALL';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 mb-6">
      {/* Top Row: Search Input + View Toggle + Mobile Filter Expand */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onUpdateFilter('searchQuery', e.target.value)}
            placeholder="Filter by subject name, subject code (26MAB1001T, 26CSE1002J, 26EEE1001T, 26PYB1001J), or keyword..."
            aria-label="Search within resources"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2.5">
          {/* Mobile Collapsible Filter Button */}
          <button
            type="button"
            onClick={() => setMobileFiltersExpanded(!mobileFiltersExpanded)}
            className="md:hidden inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{mobileFiltersExpanded ? 'Hide Filters' : 'Filters'}</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline whitespace-nowrap"
            >
              Sort by:
            </label>
            <select
              id="sort-select"
              value={filters.sortBy}
              onChange={(e) => onUpdateFilter('sortBy', e.target.value as SortOption)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title_asc">Alphabetical (A–Z)</option>
              <option value="title_desc">Alphabetical (Z–A)</option>
              <option value="code_asc">Subject Code</option>
              <option value="most_accessed">Frequently Accessed</option>
            </select>
          </div>

          {/* Segmented View Switcher (Table vs Card Grid) */}
          <div
            role="group"
            aria-label="Layout view mode"
            className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="High-density table view"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Card grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Dropdowns Grid (Always visible on desktop, collapsible on mobile) */}
      <div
        className={`${
          mobileFiltersExpanded ? 'grid' : 'hidden md:grid'
        } grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800`}
      >
        {/* Subject / Department Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Subject / Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => onUpdateFilter('department', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Uploaded Subjects (MATH · CSE · EEE · PHY)</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.code}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Year */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Academic Year
          </label>
          <select
            value={filters.academicYear}
            onChange={(e) => onUpdateFilter('academicYear', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Academic Years</option>
            {ACADEMIC_YEARS.map((yr) => (
              <option key={yr} value={yr}>
                AY {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Filter Summary & Clear Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>
            Showing{' '}
            <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
              {totalMatching}
            </strong>{' '}
            matching academic {totalMatching === 1 ? 'document' : 'documents'}
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear all active filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
