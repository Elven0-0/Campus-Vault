/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  FlaskConical,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import {
  AcademicResource,
  ActiveSection,
  InstitutionBranding,
  ResourceFilterState,
} from './types/academic';
import {
  DEPARTMENTS,
  EXAM_TYPES,
  REGULATIONS,
  SAMPLE_RESOURCES,
  SEMESTERS,
  STUDY_MATERIAL_SUBTYPES,
} from './data/sampleResources';
import {
  clearAdminSession,
  getAdminSession,
  loadBrandingFromStorage,
  loadResourcesFromStorage,
  registerUploadedFile,
  saveBrandingToStorage,
  saveResourcesToStorage,
  setAdminSession,
} from './services/resourceRepository';
import { triggerResourceDownload } from './utils/pdfGenerator';
import {
  CollapsibleSidebar,
  TopHeaderBar,
} from './components/NavbarAndSidebar';
import { HeroSection } from './components/HeroSection';
import { FilterToolbar } from './components/FilterToolbar';
import { getCategoryLabel, ResourceList } from './components/ResourceList';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { AdminDashboard } from './components/AdminDashboard';

const INITIAL_FILTERS: ResourceFilterState = {
  searchQuery: '',
  department: 'ALL',
  semester: 'ALL',
  academicYear: 'ALL',
  regulation: 'ALL',
  examType: 'ALL',
  labName: 'ALL',
  materialSubType: 'ALL',
  syllabusStatus: 'ALL',
  sortBy: 'newest',
};

export default function App() {
  const [resources, setResources] = useState<AcademicResource[]>(() =>
    loadResourcesFromStorage()
  );
  const [branding, setBranding] = useState<InstitutionBranding>(() =>
    loadBrandingFromStorage()
  );
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [filters, setFilters] = useState<ResourceFilterState>(INITIAL_FILTERS);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Document preview modal state
  const [previewResource, setPreviewResource] =
    useState<AcademicResource | null>(null);

  // Admin session state
  const [adminState, setAdminState] = useState(() => getAdminSession());

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.title = `${branding.hubName} — ${branding.institutionName}`;
  }, [branding]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const updateFilter = <K extends keyof ResourceFilterState>(
    key: K,
    value: ResourceFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleSelectSection = (section: ActiveSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Record a preview and open the modal
  const handlePreviewResource = (target: AcademicResource) => {
    setPreviewResource(target);
    setResources((prev) => {
      const next = prev.map((item) =>
        item.id === target.id
          ? { ...item, sessionViews: item.sessionViews + 1 }
          : item
      );
      saveResourcesToStorage(next);
      return next;
    });
  };

  // Record a download and trigger browser PDF save
  const handleDownloadResource = (target: AcademicResource) => {
    triggerResourceDownload(target, branding.institutionName);
    setResources((prev) => {
      const next = prev.map((item) =>
        item.id === target.id
          ? { ...item, sessionDownloads: item.sessionDownloads + 1 }
          : item
      );
      saveResourcesToStorage(next);
      return next;
    });
    showToast(`Downloading ${target.fileName}`);
  };

  // Admin CRUD handlers
  const handleAddResource = (newResource: AcademicResource) => {
    if (newResource.customFileUrl) {
      registerUploadedFile(newResource.id, newResource.customFileUrl);
    }
    setResources((prev) => {
      const next = [newResource, ...prev];
      saveResourcesToStorage(next);
      return next;
    });
    showToast(`Published ${newResource.subjectCode} to catalog`);
  };

  const handleUpdateResource = (updated: AcademicResource) => {
    if (updated.customFileUrl) {
      registerUploadedFile(updated.id, updated.customFileUrl);
    }
    setResources((prev) => {
      const next = prev.map((item) =>
        item.id === updated.id ? updated : item
      );
      saveResourcesToStorage(next);
      return next;
    });
    showToast(`Updated ${updated.subjectCode} metadata`);
  };

  const handleDeleteResource = (id: string) => {
    setResources((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveResourcesToStorage(next);
      return next;
    });
    showToast('Removed resource from repository');
  };

  const handleResetToSampleCatalog = () => {
    setResources(SAMPLE_RESOURCES);
    saveResourcesToStorage(SAMPLE_RESOURCES);
    showToast('Restored default institutional sample catalog');
  };

  const handleUpdateBranding = (newBranding: InstitutionBranding) => {
    setBranding(newBranding);
    saveBrandingToStorage(newBranding);
    showToast('Updated institution branding');
  };

  // Counts by category
  const categoryCounts = useMemo(() => {
    return {
      questionPapers: resources.filter((r) => r.category === 'question_paper')
        .length,
      labManuals: resources.filter((r) => r.category === 'lab_manual').length,
      syllabi: resources.filter((r) => r.category === 'syllabus').length,
      studyMaterials: resources.filter((r) => r.category === 'study_material')
        .length,
    };
  }, [resources]);

  const uniqueSubjectCount = useMemo(() => {
    return new Set(resources.map((r) => r.subjectCode)).size;
  }, [resources]);

  const availableLabs = useMemo(() => {
    const labs = resources
      .filter((r) => r.category === 'lab_manual' && r.labName)
      .map((r) => r.labName as string);
    return Array.from(new Set(labs));
  }, [resources]);

  // Filtered and sorted resources for the current section
  const filteredResources = useMemo(() => {
    return resources
      .filter((item) => {
        // Section category filter
        if (
          activeSection === 'question_papers' &&
          item.category !== 'question_paper'
        ) {
          return false;
        }
        if (activeSection === 'lab_manuals' && item.category !== 'lab_manual') {
          return false;
        }
        if (activeSection === 'syllabus' && item.category !== 'syllabus') {
          return false;
        }
        if (
          activeSection === 'study_materials' &&
          item.category !== 'study_material'
        ) {
          return false;
        }

        // Department
        if (
          filters.department !== 'ALL' &&
          item.department !== filters.department
        ) {
          return false;
        }

        // Semester
        if (
          filters.semester !== 'ALL' &&
          String(item.semester) !== filters.semester
        ) {
          return false;
        }

        // Academic Year
        if (
          filters.academicYear !== 'ALL' &&
          item.academicYear !== filters.academicYear
        ) {
          return false;
        }

        // Regulation
        if (
          filters.regulation !== 'ALL' &&
          item.regulation !== filters.regulation
        ) {
          return false;
        }

        // Exam Type
        if (
          filters.examType !== 'ALL' &&
          item.examType !== filters.examType
        ) {
          return false;
        }

        // Lab Name
        if (filters.labName !== 'ALL' && item.labName !== filters.labName) {
          return false;
        }

        // Study Material SubType
        if (
          filters.materialSubType !== 'ALL' &&
          item.materialSubType !== filters.materialSubType
        ) {
          return false;
        }

        // Syllabus Status
        if (filters.syllabusStatus === 'CURRENT' && item.isArchived) {
          return false;
        }
        if (filters.syllabusStatus === 'ARCHIVED' && !item.isArchived) {
          return false;
        }

        // Search Query
        const q = filters.searchQuery.trim().toLowerCase();
        if (q) {
          const haystack = [
            item.title,
            item.subjectName,
            item.subjectCode,
            item.department,
            item.regulation,
            item.academicYear,
            item.examType || '',
            item.labName || '',
            item.materialSubType || '',
            item.summary,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'newest':
            return b.lastUpdated.localeCompare(a.lastUpdated);
          case 'oldest':
            return a.lastUpdated.localeCompare(b.lastUpdated);
          case 'title_asc':
            return a.title.localeCompare(b.title);
          case 'title_desc':
            return b.title.localeCompare(a.title);
          case 'code_asc':
            return a.subjectCode.localeCompare(b.subjectCode);
          case 'most_accessed':
            return (
              b.sessionViews +
              b.sessionDownloads * 2 -
              (a.sessionViews + a.sessionDownloads * 2)
            );
          default:
            return 0;
        }
      });
  }, [resources, activeSection, filters]);

  const recentlyAddedResources = useMemo(() => {
    return [...resources]
      .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
      .slice(0, 5);
  }, [resources]);

  const frequentlyAccessedResources = useMemo(() => {
    return [...resources]
      .sort(
        (a, b) =>
          b.sessionViews +
          b.sessionDownloads * 2 -
          (a.sessionViews + a.sessionDownloads * 2)
      )
      .slice(0, 5);
  }, [resources]);

  const hasAnyHomeFilterActive =
    filters.searchQuery.trim() !== '' ||
    filters.department !== 'ALL' ||
    filters.semester !== 'ALL' ||
    filters.academicYear !== 'ALL' ||
    filters.regulation !== 'ALL' ||
    filters.examType !== 'ALL';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Left Collapsible Sidebar (Desktop) & Slide-Over Drawer (Mobile) */}
      <CollapsibleSidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={setMobileMenuOpen}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        branding={branding}
        isAdminAuthenticated={adminState.isAuthenticated}
        counts={categoryCounts}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Strict 3-Zone Top Bar */}
        <TopHeaderBar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={setMobileMenuOpen}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          branding={branding}
          isAdminAuthenticated={adminState.isAuthenticated}
          counts={categoryCounts}
        />

        {/* Main Viewport */}
        <main className="flex-1">
          {/* ================= HOMEPAGE VIEW ================= */}
          {activeSection === 'home' && (
            <div>
              {/* Hero Section with Global Search & Cursor Spotlight */}
              <HeroSection
                branding={branding}
                searchQuery={filters.searchQuery}
                onSearchChange={(q) => updateFilter('searchQuery', q)}
                onSelectSection={handleSelectSection}
                onQuickFilterDepartment={(deptCode) => {
                  updateFilter('department', deptCode);
                  const el = document.getElementById('global-search-results');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                onQuickFilterSemester={(sem) => {
                  updateFilter('semester', String(sem));
                  const el = document.getElementById('global-search-results');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                onPreviewResource={handlePreviewResource}
                departments={DEPARTMENTS}
                matchingSuggestions={filteredResources}
              />

              {/* Full-Width Real Repository Statistics Strip */}
              <section
                aria-label="Academic Repository Statistics"
                className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
              >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70 dark:divide-slate-800">
                    <div className="pt-2 sm:pt-0 sm:px-4 first:pl-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Indexed Academic Resources
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {resources.length}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Papers, lab manuals, syllabi & keys
                      </p>
                    </div>

                    <div className="pt-2 sm:pt-0 sm:px-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Uploaded Core Subjects
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {uniqueSubjectCount}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        26MAB1001T · 26CSE1002J · 26EEE1001T · 26PYB1001J
                      </p>
                    </div>

                    <div className="pt-2 sm:pt-0 sm:px-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Question Papers & Manuals
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {categoryCounts.questionPapers + categoryCounts.labManuals}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {categoryCounts.questionPapers} Exam Papers · {categoryCounts.labManuals} Lab Manuals
                      </p>
                    </div>

                    <div className="pt-2 sm:pt-0 sm:px-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Official Syllabi Indexed
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {categoryCounts.syllabi}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        26MAB1001T · 26CSE1002J · 26PYB1001J
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
                {/* 3 Prominent Resource Category Cards */}
                <section aria-labelledby="primary-categories-heading">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
                    <div>
                      <h2
                        id="primary-categories-heading"
                        className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display"
                      >
                        Core Academic Resource Libraries
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Dedicated archives for Calculus and Linear Algebra (26MAB1001T),
                        Programming for Problem Solving (26CSE1002J), and Electrical &amp;
                        Electronics Engineering (26EEE1001T).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Question Papers */}
                    <button
                      type="button"
                      onClick={() => handleSelectSection('question_papers')}
                      className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-6 transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {categoryCounts.questionPapers} Papers Indexed
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          Previous-Year Question Papers
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                          Official degree examination papers (2022–2025) for
                          26MAB1001T (11 papers), 26CSE1002J (5 papers), and
                          26EEE1001T (3 papers).
                        </p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>Open Question Paper Archive</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>

                    {/* Card 2: Lab Manuals */}
                    <button
                      type="button"
                      onClick={() => handleSelectSection('lab_manuals')}
                      className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-6 transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <FlaskConical className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {categoryCounts.labManuals} Lab Manuals
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          Laboratory Manuals
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                          Complete 26CSE1002J eLab C Programming Manual (Modules 1–10)
                          and 26EEE1001T Electrical &amp; Electronics Engineering Lab
                          Manual.
                        </p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>Browse Laboratory Library</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>

                    {/* Card 3: Syllabus Library */}
                    <button
                      type="button"
                      onClick={() => handleSelectSection('syllabus')}
                      className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-6 transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {categoryCounts.syllabi} Curriculum Books
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          Official Syllabus Library
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                          Official SRMIST 5-unit curriculum syllabi for
                          26MAB1001T (Calculus &amp; Linear Algebra), 26CSE1002J
                          (Programming for Problem Solving), and 26PYB1001J
                          (Statistical &amp; Quantum Physics).
                        </p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>Explore Curriculum Syllabi</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  </div>
                </section>

                {/* Quick-Access Subject & Semester Explorer */}
                <section
                  aria-labelledby="quick-access-heading"
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2
                        id="quick-access-heading"
                        className="text-base font-bold text-slate-900 dark:text-white font-display"
                      >
                        Quick-Access Subject &amp; Semester Filter
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Filter all uploaded materials across the hub by selecting
                        your subject or semester below.
                      </p>
                    </div>
                    {hasAnyHomeFilterActive && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start md:self-auto"
                      >
                        Reset Quick Selection
                      </button>
                    )}
                  </div>

                  <div className="mt-4 space-y-4">
                    {/* Subject / Department Buttons */}
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Filter by Uploaded Subject:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateFilter('department', 'ALL')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                            filters.department === 'ALL'
                              ? 'bg-slate-900 text-white dark:bg-indigo-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          All 4 Subjects
                        </button>
                        {DEPARTMENTS.map((dept) => (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => updateFilter('department', dept.code)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                              filters.department === dept.code
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {dept.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Semester Buttons */}
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Filter by Semester:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateFilter('semester', 'ALL')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                            filters.semester === 'ALL'
                              ? 'bg-slate-900 text-white dark:bg-indigo-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          All Semesters
                        </button>
                        {SEMESTERS.map((sem) => (
                          <button
                            key={sem}
                            type="button"
                            onClick={() => updateFilter('semester', String(sem))}
                            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors whitespace-nowrap tabular-nums ${
                              filters.semester === String(sem)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            Semester {sem}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Recently Added & Frequently Accessed Dual Showcase (When no active search/filter) */}
                {!hasAnyHomeFilterActive && (
                  <section
                    aria-label="Recent and Frequently Accessed Materials"
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
                  >
                    {/* Recently Added */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                              Recently Added Resources
                            </h2>
                          </div>
                          <span className="text-xs text-slate-400">
                            Latest updates
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
                          {recentlyAddedResources.map((item) => (
                            <div
                              key={item.id}
                              className="py-3.5 flex items-start justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                    {item.subjectCode}
                                  </span>
                                  <span aria-hidden="true" className="mx-1.5">
                                    ·
                                  </span>
                                  <span>{item.department}</span>
                                  <span aria-hidden="true" className="mx-1.5">
                                    ·
                                  </span>
                                  <span>Sem {item.semester}</span>
                                  <span aria-hidden="true" className="mx-1.5">
                                    ·
                                  </span>
                                  <span className="font-mono tabular-nums">
                                    {item.lastUpdated}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handlePreviewResource(item)}
                                  className="text-left text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 mt-0.5"
                                >
                                  {item.title}
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewResource(item)}
                                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                  title="Preview document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadResource(item)}
                                  className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Frequently Accessed */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                              Frequently Accessed Resources
                            </h2>
                          </div>
                          <span className="text-xs text-slate-400">
                            By student activity
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
                          {frequentlyAccessedResources.map((item) => (
                            <div
                              key={item.id}
                              className="py-3.5 flex items-start justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                    {item.subjectCode}
                                  </span>
                                  <span aria-hidden="true" className="mx-1.5">
                                    ·
                                  </span>
                                  <span>{getCategoryLabel(item.category)}</span>
                                  <span aria-hidden="true" className="mx-1.5">
                                    ·
                                  </span>
                                  <span className="font-mono tabular-nums">
                                    {item.sessionViews} views /{' '}
                                    {item.sessionDownloads} downloads
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handlePreviewResource(item)}
                                  className="text-left text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 mt-0.5"
                                >
                                  {item.title}
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewResource(item)}
                                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                  title="Preview document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadResource(item)}
                                  className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Global Search & Complete Directory Explorer */}
                <section
                  id="global-search-results"
                  aria-labelledby="complete-catalog-heading"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
                    <div>
                      <h2
                        id="complete-catalog-heading"
                        className="text-xl font-bold text-slate-900 dark:text-white font-display"
                      >
                        {hasAnyHomeFilterActive
                          ? 'Filtered Academic Search Results'
                          : 'Complete Institutional Resource Directory'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Combine department, semester, regulation, and keyword
                        filters to pinpoint any document immediately.
                      </p>
                    </div>
                  </div>

                  <FilterToolbar
                    activeSection="home"
                    filters={filters}
                    onUpdateFilter={updateFilter}
                    onResetFilters={resetFilters}
                    departments={DEPARTMENTS}
                    availableLabs={availableLabs}
                    totalMatching={filteredResources.length}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />

                  <ResourceList
                    resources={filteredResources}
                    viewMode={viewMode}
                    onPreview={handlePreviewResource}
                    onDownload={handleDownloadResource}
                    onResetFilters={resetFilters}
                  />
                </section>
              </div>
            </div>
          )}

          {/* ================= DEDICATED LIBRARY SECTIONS ================= */}
          {(activeSection === 'question_papers' ||
            activeSection === 'lab_manuals' ||
            activeSection === 'syllabus') && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Section Header Banner */}
              <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {branding.hubName} · {branding.institutionName}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display mt-1">
                    {activeSection === 'question_papers' &&
                      'Previous-Year University Question Papers'}
                    {activeSection === 'lab_manuals' &&
                      'Department Laboratory Manuals & Workbooks'}
                    {activeSection === 'syllabus' &&
                      'Official Curriculum & Syllabus Library'}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
                    {activeSection === 'question_papers' &&
                      'Official degree examination question papers for Calculus and Linear Algebra (26MAB1001T), Programming for Problem Solving (26CSE1002J), and Electrical and Electronics Engineering (26EEE1001T).'}
                    {activeSection === 'lab_manuals' &&
                      'Official practical laboratory manuals for Programming for Problem Solving eLab (26CSE1002J) and Electrical and Electronics Engineering (26EEE1001T).'}
                    {activeSection === 'syllabus' &&
                      'Official SRMIST 5-unit curriculum syllabi for Calculus and Linear Algebra (26MAB1001T), Programming for Problem Solving (26CSE1002J), and Statistical and Quantum Physics for Computational Intelligence (26PYB1001J).'}
                  </p>
                </div>
              </div>

              <FilterToolbar
                activeSection={activeSection}
                filters={filters}
                onUpdateFilter={updateFilter}
                onResetFilters={resetFilters}
                departments={DEPARTMENTS}
                availableLabs={availableLabs}
                totalMatching={filteredResources.length}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              <ResourceList
                resources={filteredResources}
                viewMode={viewMode}
                onPreview={handlePreviewResource}
                onDownload={handleDownloadResource}
                onResetFilters={resetFilters}
              />
            </div>
          )}

          {/* ================= ADMIN DASHBOARD SECTION ================= */}
          {activeSection === 'admin' && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AdminDashboard
                resources={resources}
                departments={DEPARTMENTS}
                branding={branding}
                isAdminAuthenticated={adminState.isAuthenticated}
                adminEmail={adminState.email}
                onLoginSuccess={(email) => {
                  setAdminSession(email);
                  setAdminState({
                    isAuthenticated: true,
                    email,
                    role: 'Academic Administrator',
                  });
                  showToast('Signed in to Admin Resource Console');
                }}
                onLogout={() => {
                  clearAdminSession();
                  setAdminState({
                    isAuthenticated: false,
                    email: '',
                    role: 'student',
                  });
                  showToast('Signed out of Admin Console');
                }}
                onAddResource={handleAddResource}
                onUpdateResource={handleUpdateResource}
                onDeleteResource={handleDeleteResource}
                onResetToSampleCatalog={handleResetToSampleCatalog}
                onUpdateBranding={handleUpdateBranding}
                onPreviewResource={handlePreviewResource}
              />
            </div>
          )}
        </main>

        {/* Quiet Academic Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                <strong className="text-slate-900 dark:text-white font-display">
                  {branding.hubName}
                </strong>{' '}
                · {branding.institutionName} · Regulation{' '}
                {branding.defaultRegulation}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleSelectSection('question_papers')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Question Papers
              </button>
              <button
                type="button"
                onClick={() => handleSelectSection('lab_manuals')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Lab Manuals
              </button>
              <button
                type="button"
                onClick={() => handleSelectSection('syllabus')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Syllabus
              </button>
              <button
                type="button"
                onClick={() => handleSelectSection('admin')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Admin Portal
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Document Preview & Browser PDF Viewer Modal */}
      <DocumentPreviewModal
        resource={previewResource}
        institutionName={branding.institutionName}
        onClose={() => setPreviewResource(null)}
        onDownload={handleDownloadResource}
      />

      {/* Subtle Action Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium shadow-lg border border-slate-700"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
