import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Download,
  FileCheck,
  FileText,
  Printer,
  X,
} from 'lucide-react';
import { AcademicResource } from '../types/academic';
import { generateAcademicPdfBlob } from '../utils/pdfGenerator';
import { getCategoryLabel } from './ResourceList';

interface DocumentPreviewModalProps {
  resource: AcademicResource | null;
  institutionName: string;
  onClose: () => void;
  onDownload: (resource: AcademicResource) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  resource,
  institutionName,
  onClose,
  onDownload,
}) => {
  const [previewMode, setPreviewMode] = useState<'reader' | 'pdf'>('reader');
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!resource) {
      setPdfObjectUrl(null);
      return;
    }

    if (resource.customFileUrl && resource.fileFormat === 'PDF') {
      setPdfObjectUrl(resource.customFileUrl);
      setPreviewMode('pdf');
      return;
    }

    setPreviewMode('reader');
    const blob = generateAcademicPdfBlob(resource, institutionName);
    const url = URL.createObjectURL(blob);
    setPdfObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [resource, institutionName]);

  if (!resource) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Window */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {resource.subjectCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>{getCategoryLabel(resource.category)}</span>
              <span aria-hidden="true">·</span>
              <span>{resource.department}</span>
              <span aria-hidden="true">·</span>
              <span>Semester {resource.semester}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{resource.regulation}</span>
            </div>
            <h2
              id="preview-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display truncate mt-0.5"
            >
              {resource.title}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Segmented Mode Switcher: Structured Reader vs Native PDF Frame */}
            <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewMode('reader')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  previewMode === 'reader'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Structured View</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('pdf')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  previewMode === 'pdf'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Browser PDF Frame</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDownload(resource)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ({resource.fileSizeFormatted})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
              aria-label="Close document preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Document Viewer + Metadata Sidebar */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left 8 Columns: Document Sheet or Native PDF Embed */}
          <div className="lg:col-span-8 p-5 sm:p-8 bg-slate-100/70 dark:bg-slate-950/60 overflow-y-auto">
            {previewMode === 'pdf' && pdfObjectUrl ? (
              <div className="w-full h-[540px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                <iframe
                  src={pdfObjectUrl}
                  title={`PDF Preview for ${resource.title}`}
                  className="w-full flex-1 border-0"
                />
              </div>
            ) : (
              /* Clean Academic Document Sheet */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto">
                <div className="pb-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {institutionName}
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display mt-1">
                      {resource.subjectCode}: {resource.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {resource.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (pdfObjectUrl) {
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = pdfObjectUrl;
                        document.body.appendChild(iframe);
                        iframe.onload = () => {
                          iframe.contentWindow?.print();
                        };
                      }
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg"
                    title="Print document"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>

                {/* Document Summary */}
                <div className="py-4 border-b border-slate-100 dark:border-slate-800/80">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Document Scope & Overview
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {resource.summary}
                  </p>
                </div>

                {/* Document Sections (Questions / Lab Experiments / Syllabus Units) */}
                <div className="mt-5 space-y-6">
                  {resource.contentSections.map((sec, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display mb-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        {sec.heading}
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {sec.body.map((line, lineIdx) => (
                          <li key={lineIdx} className="pl-1">
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 4 Columns: Document Metadata & Cataloging Details */}
          <div className="lg:col-span-4 p-5 sm:p-6 bg-white dark:bg-slate-900 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                Document Cataloging Metadata
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified academic index attributes
              </p>
            </div>

            <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Subject Code</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-white">
                  {resource.subjectCode}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Department</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {resource.department}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Semester</dt>
                <dd className="font-mono tabular-nums text-slate-900 dark:text-white">
                  Semester {resource.semester}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Regulation Scheme</dt>
                <dd className="font-mono text-slate-900 dark:text-white">
                  {resource.regulation}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Academic Year</dt>
                <dd className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {resource.academicYear}
                </dd>
              </div>
              {resource.examType && (
                <div className="py-2.5 flex justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">Examination Type</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">
                    {resource.examType}
                  </dd>
                </div>
              )}
              {resource.labName && (
                <div className="py-2.5 flex justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">Laboratory</dt>
                  <dd className="font-medium text-slate-900 dark:text-white text-right">
                    {resource.labName}
                  </dd>
                </div>
              )}
              {resource.materialSubType && (
                <div className="py-2.5 flex justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">Material Category</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">
                    {resource.materialSubType}
                  </dd>
                </div>
              )}
              <div className="py-2.5 flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">File Name</dt>
                <dd className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                  {resource.fileName}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Format & Size</dt>
                <dd className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {resource.fileFormat} · {resource.fileSizeFormatted}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Last Updated</dt>
                <dd className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {resource.lastUpdated}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Maintained By</dt>
                <dd className="text-slate-700 dark:text-slate-300 text-right">
                  {resource.uploadedBy}
                </dd>
              </div>
            </dl>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {resource.isSampleData
                    ? 'Sample Institutional Catalog Entry'
                    : 'Administrator Uploaded Document'}
                </span>
              </div>
              <p className="leading-relaxed">
                Students have read-only access to view and download verified
                academic materials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
