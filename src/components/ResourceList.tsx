import React from 'react';
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  FlaskConical,
  FolderKanban,
  RotateCcw,
} from 'lucide-react';
import { AcademicResource, ResourceCategory } from '../types/academic';

interface ResourceListProps {
  resources: AcademicResource[];
  viewMode: 'table' | 'grid';
  onPreview: (resource: AcademicResource) => void;
  onDownload: (resource: AcademicResource) => void;
  onResetFilters?: () => void;
  emptyMessage?: string;
}

export function getCategoryIcon(category: ResourceCategory) {
  switch (category) {
    case 'question_paper':
      return FileText;
    case 'lab_manual':
      return FlaskConical;
    case 'syllabus':
      return BookOpen;
    case 'study_material':
      return FolderKanban;
  }
}

export function getCategoryLabel(category: ResourceCategory): string {
  switch (category) {
    case 'question_paper':
      return 'Question Paper';
    case 'lab_manual':
      return 'Lab Manual';
    case 'syllabus':
      return 'Syllabus';
    case 'study_material':
      return 'Study Material';
  }
}

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  viewMode,
  onPreview,
  onDownload,
  onResetFilters,
  emptyMessage = 'No academic resources match your current filter selection.',
}) => {
  if (resources.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white font-display">
          No Matching Documents Found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {emptyMessage}
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 pl-5 pr-3">Code</th>
                <th className="py-3 px-3">Document & Subject</th>
                <th className="py-3 px-3">Dept & Sem</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Scheme / Year</th>
                <th className="py-3 px-3 text-right">Format</th>
                <th className="py-3 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-sm">
              {resources.map((item) => {
                const Icon = getCategoryIcon(item.category);
                const classification =
                  item.examType ||
                  item.labName ||
                  item.materialSubType ||
                  (item.category === 'syllabus'
                    ? item.isArchived
                      ? 'Archived Syllabus'
                      : 'Current Active Syllabus'
                    : getCategoryLabel(item.category));

                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 pl-5 pr-3 align-top whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {item.subjectCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 align-top max-w-md">
                      <div className="flex items-start gap-2.5">
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onPreview(item)}
                            className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                          >
                            {item.title}
                          </button>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {item.subjectName} · Updated{' '}
                            <span className="font-mono tabular-nums">
                              {item.lastUpdated}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 align-top whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {item.department}
                      </span>
                      <span aria-hidden="true" className="mx-1.5 text-slate-300 dark:text-slate-600">
                        ·
                      </span>
                      <span className="tabular-nums">Sem {item.semester}</span>
                    </td>
                    <td className="py-3.5 px-3 align-top text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                      {classification}
                      {item.category === 'syllabus' && (
                        <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                          {item.isArchived
                            ? 'Superseded reference'
                            : 'Official active regulation'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 align-top whitespace-nowrap text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                      <span>{item.regulation}</span>
                      <span aria-hidden="true" className="mx-1.5 text-slate-300 dark:text-slate-600">
                        /
                      </span>
                      <span>{item.academicYear}</span>
                    </td>
                    <td className="py-3.5 px-3 align-top whitespace-nowrap text-right text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {item.fileFormat} · {item.fileSizeFormatted}
                    </td>
                    <td className="py-3.5 pl-3 pr-5 align-top whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onPreview(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownload(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked List View (Adapts cleanly without horizontal overflow) */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {resources.map((item) => {
            const classification =
              item.examType ||
              item.labName ||
              item.materialSubType ||
              (item.isArchived ? 'Archived Syllabus' : 'Current Syllabus');
            return (
              <div key={item.id} className="p-4 space-y-2.5">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {item.subjectCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.department}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">Sem {item.semester}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{item.regulation}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{item.academicYear}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onPreview(item)}
                  className="text-left text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 block"
                >
                  {item.title}
                </button>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.subjectName} · {classification} · {item.fileFormat} (
                  {item.fileSizeFormatted})
                </p>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPreview(item)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownload(item)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Card Grid View (Zero-Pill Metadata, Single-Elevation Depth, Subtle Hover Lift)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
      {resources.map((item) => {
        const Icon = getCategoryIcon(item.category);
        const detailMeta =
          item.examType ||
          item.labName ||
          item.materialSubType ||
          (item.isArchived ? 'Archived Curriculum' : 'Current Active Curriculum');

        return (
          <article
            key={item.id}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 rounded-xl p-5 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5"
          >
            <div>
              {/* Quiet 1-line unboxed text kicker (Strict Zero-Pill compliance) */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {item.subjectCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.department}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">Sem {item.semester}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{item.regulation}</span>
                </div>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
              </div>

              {/* Primary Card Title */}
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-display leading-snug">
                <button
                  type="button"
                  onClick={() => onPreview(item)}
                  className="text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {item.title}
                </button>
              </h3>

              {/* Subject & Specific Classification */}
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                {item.subjectName} · {detailMeta}
              </p>

              {/* Brief Summary */}
              <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {item.summary}
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums truncate">
                <span>{item.academicYear}</span>
                <span aria-hidden="true" className="mx-1">
                  ·
                </span>
                <span>{item.fileFormat}</span>
                <span aria-hidden="true" className="mx-1">
                  ·
                </span>
                <span>{item.fileSizeFormatted}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onPreview(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDownload(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
