import React, { useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Edit3,
  Eye,
  FileUp,
  KeyRound,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AcademicResource,
  DepartmentInfo,
  ExamType,
  InstitutionBranding,
  RegulationScheme,
  ResourceCategory,
  StudyMaterialSubType,
} from '../types/academic';
import {
  ACADEMIC_YEARS,
  EXAM_TYPES,
  REGULATIONS,
  SEMESTERS,
  STUDY_MATERIAL_SUBTYPES,
} from '../data/sampleResources';
import {
  checkDuplicateResource,
  detectFileFormat,
  formatFileSize,
} from '../services/resourceRepository';
import { getCategoryLabel } from './ResourceList';

interface AdminDashboardProps {
  resources: AcademicResource[];
  departments: DepartmentInfo[];
  branding: InstitutionBranding;
  isAdminAuthenticated: boolean;
  adminEmail: string;
  onLoginSuccess: (email: string) => void;
  onLogout: () => void;
  onAddResource: (newResource: AcademicResource) => void;
  onUpdateResource: (updated: AcademicResource) => void;
  onDeleteResource: (id: string) => void;
  onResetToSampleCatalog: () => void;
  onUpdateBranding: (newBranding: InstitutionBranding) => void;
  onPreviewResource: (resource: AcademicResource) => void;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB limit

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  resources,
  departments,
  branding,
  isAdminAuthenticated,
  adminEmail,
  onLoginSuccess,
  onLogout,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onResetToSampleCatalog,
  onUpdateBranding,
  onPreviewResource,
}) => {
  // Authentication form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin sub-tab
  const [activeTab, setActiveTab] = useState<'manage' | 'upload' | 'branding'>('manage');

  // Upload / Edit Form State
  const [editingResource, setEditingResource] = useState<AcademicResource | null>(null);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [department, setDepartment] = useState('MATH');
  const [semester, setSemester] = useState<number>(1);
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [regulation, setRegulation] = useState<RegulationScheme>('R2021');
  const [category, setCategory] = useState<ResourceCategory>('question_paper');
  const [examType, setExamType] = useState<ExamType>('End-Semester');
  const [labName, setLabName] = useState('');
  const [materialSubType, setMaterialSubType] =
    useState<StudyMaterialSubType>('Lecture Notes');
  const [isCurrentSyllabus, setIsCurrentSyllabus] = useState(true);
  const [summary, setSummary] = useState('');
  const [questionsOrUnitsText, setQuestionsOrUnitsText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Delete confirmation modal state
  const [resourceToDelete, setResourceToDelete] = useState<AcademicResource | null>(
    null
  );

  // Filter inside Admin Manage Table
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('ALL');

  // Branding customization state
  const [brandForm, setBrandForm] = useState<InstitutionBranding>(branding);
  const [brandSavedMsg, setBrandSavedMsg] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (
      loginEmail.trim() === 'Elven' &&
      loginPassword === 'Elven@007'
    ) {
      onLoginSuccess('Elven');
    } else {
      setLoginError(
        'Invalid administrator credentials. Please enter the authorized username and password.'
      );
    }
  };

  const resetForm = () => {
    setEditingResource(null);
    setTitle('');
    setSubjectName('');
    setSubjectCode('');
    setDepartment('MATH');
    setSemester(1);
    setAcademicYear('2024-25');
    setRegulation('R2021');
    setCategory('question_paper');
    setExamType('End-Semester');
    setLabName('');
    setMaterialSubType('Lecture Notes');
    setIsCurrentSyllabus(true);
    setSummary('');
    setQuestionsOrUnitsText('');
    setSelectedFile(null);
    setSelectedFileUrl(undefined);
    setUploadProgress(0);
  };

  const startEditing = (res: AcademicResource) => {
    setEditingResource(res);
    setTitle(res.title);
    setSubjectName(res.subjectName);
    setSubjectCode(res.subjectCode);
    setDepartment(res.department);
    setSemester(res.semester);
    setAcademicYear(res.academicYear);
    setRegulation(res.regulation);
    setCategory(res.category);
    if (res.examType) setExamType(res.examType);
    if (res.labName) setLabName(res.labName);
    if (res.materialSubType) setMaterialSubType(res.materialSubType);
    setIsCurrentSyllabus(!res.isArchived);
    setSummary(res.summary);
    const lines = res.contentSections.flatMap((s) => s.body).join('\n');
    setQuestionsOrUnitsText(lines);
    setSelectedFile(null);
    setSelectedFileUrl(res.customFileUrl);
    setFormFeedback(null);
    setActiveTab('upload');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'zip'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      setFormFeedback({
        type: 'error',
        message:
          'Unsupported file format. Please upload a PDF, DOCX, PPTX, or ZIP document.',
      });
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormFeedback({
        type: 'error',
        message: `File size (${formatFileSize(
          file.size
        )}) exceeds the 25 MB institutional upload limit.`,
      });
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    const blobUrl = URL.createObjectURL(file);
    setSelectedFileUrl(blobUrl);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  const buildDraftResource = (): AcademicResource => {
    const cleanCode = subjectCode.trim().toUpperCase() || '26MAB1001T';
    const cleanTitle =
      title.trim() || `${cleanCode} ${subjectName.trim() || 'Academic Resource'}`;
    const parsedLines = questionsOrUnitsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return {
      id: editingResource ? editingResource.id : `res-${Date.now()}`,
      title: cleanTitle,
      subjectName: subjectName.trim() || cleanTitle,
      subjectCode: cleanCode,
      department,
      semester,
      academicYear,
      regulation,
      category,
      examType: category === 'question_paper' ? examType : undefined,
      labName:
        category === 'lab_manual'
          ? labName.trim() || `${department} Academic Laboratory`
          : undefined,
      materialSubType: category === 'study_material' ? materialSubType : undefined,
      isCurrentSyllabus: category === 'syllabus' ? isCurrentSyllabus : undefined,
      isArchived: category === 'syllabus' ? !isCurrentSyllabus : undefined,
      fileFormat: selectedFile
        ? detectFileFormat(selectedFile.name)
        : editingResource?.fileFormat || 'PDF',
      fileSizeBytes: selectedFile
        ? selectedFile.size
        : editingResource?.fileSizeBytes || 358400,
      fileSizeFormatted: selectedFile
        ? formatFileSize(selectedFile.size)
        : editingResource?.fileSizeFormatted || '350 KB',
      fileName: selectedFile
        ? selectedFile.name
        : editingResource?.fileName || `${cleanCode}_${category}_${academicYear}.pdf`,
      lastUpdated: new Date().toISOString().split('T')[0],
      uploadedBy: adminEmail || 'Academic Administrator',
      summary:
        summary.trim() ||
        `Official ${getCategoryLabel(category)} for ${cleanCode} ${subjectName.trim()} (${department}, Semester ${semester}, Regulation ${regulation}).`,
      contentSections: [
        {
          heading:
            category === 'question_paper'
              ? 'Examination Questions & Sections'
              : category === 'lab_manual'
                ? 'Laboratory Experiments & Procedures'
                : category === 'syllabus'
                  ? 'Curriculum Units & Outcomes'
                  : 'Study Material Outline',
          body:
            parsedLines.length > 0
              ? parsedLines
              : [
                  `Verified ${getCategoryLabel(category)} uploaded via ${branding.hubName} Admin Portal.`,
                  `Applicable for ${department} Semester ${semester} under Regulation ${regulation} (${academicYear}).`,
                ],
        },
      ],
      customFileUrl: selectedFileUrl,
      isSampleData: false,
      sessionViews: editingResource?.sessionViews || 1,
      sessionDownloads: editingResource?.sessionDownloads || 0,
    };
  };

  const handlePublishOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!title.trim() || !subjectName.trim() || !subjectCode.trim()) {
      setFormFeedback({
        type: 'error',
        message:
          'Please fill in all required fields: Document Title, Subject Name, and Subject Code.',
      });
      return;
    }

    // Check for duplicate resource
    const duplicate = checkDuplicateResource(resources, {
      subjectCode,
      category,
      academicYear,
      examType: category === 'question_paper' ? examType : undefined,
      regulation,
      excludeId: editingResource?.id,
    });

    if (duplicate && !editingResource) {
      setFormFeedback({
        type: 'warning',
        message: `Duplicate prevented: "${duplicate.title}" (${duplicate.subjectCode}, ${duplicate.academicYear}) is already cataloged in this category. Edit the existing entry instead.`,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(25);

    setTimeout(() => {
      setUploadProgress(70);
    }, 120);

    setTimeout(() => {
      setUploadProgress(100);
      const draft = buildDraftResource();
      if (editingResource) {
        onUpdateResource(draft);
        setFormFeedback({
          type: 'success',
          message: `Updated "${draft.title}" (${draft.subjectCode}) in the repository.`,
        });
      } else {
        onAddResource(draft);
        setFormFeedback({
          type: 'success',
          message: `Published "${draft.title}" (${draft.subjectCode}) to the live catalog.`,
        });
      }
      setIsUploading(false);
      resetForm();
    }, 280);
  };

  const toggleSyllabusArchiveStatus = (res: AcademicResource) => {
    const nextArchived = !res.isArchived;
    onUpdateResource({
      ...res,
      isArchived: nextArchived,
      isCurrentSyllabus: !nextArchived,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <KeyRound className="w-5 h-5" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
          Faculty & Administrator Sign In
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Students have full read-only access to browse, preview, and download
          published academic resources. Sign in with an authorized faculty account
          to upload, edit, or archive materials.
        </p>

        {loginError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{loginError}</span>
          </div>
        )}

        <form
          onSubmit={handleLoginSubmit}
          autoComplete="off"
          className="mt-5 space-y-4"
        >
          <div>
            <label
              htmlFor="admin-username"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Administrator Username
            </label>
            <input
              id="admin-username"
              name="campusvault_admin_user"
              type="text"
              required
              autoComplete="off"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter username"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Administrator Password
            </label>
            <input
              id="admin-password"
              name="campusvault_admin_pass"
              type="password"
              required
              autoComplete="new-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Unlock Resource Management Console
          </button>
        </form>
      </div>
    );
  }

  const filteredAdminResources = resources.filter((r) => {
    const matchesCategory =
      adminCategoryFilter === 'ALL' || r.category === adminCategoryFilter;
    const q = adminSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.subjectCode.toLowerCase().includes(q) ||
      r.subjectName.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const totalSessionViews = resources.reduce((acc, r) => acc + r.sessionViews, 0);
  const totalSessionDownloads = resources.reduce(
    (acc, r) => acc + r.sessionDownloads,
    0
  );

  return (
    <div className="space-y-6">
      {/* Admin Header Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Administrator Session · {adminEmail}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display mt-1">
            Academic Resource Management & Repository Console
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'manage'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Catalog Inventory ({resources.length})
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('upload');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingResource ? 'Edit Document' : 'Upload Resource'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('branding')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'branding'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Institution Branding</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Real Repository Telemetry & Usage Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Published Resources
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {resources.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {departments.length} academic departments
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active R2021 Syllabi
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {
              resources.filter(
                (r) => r.category === 'syllabus' && !r.isArchived
              ).length
            }
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {
              resources.filter((r) => r.category === 'syllabus' && r.isArchived)
                .length
            }{' '}
            archived legacy syllabi
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Recorded Document Previews
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {totalSessionViews}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Live session + baseline catalog views
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Recorded File Downloads
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {totalSessionDownloads}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Tracked on download trigger
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {formFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            formFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : formFeedback.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {formFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{formFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormFeedback(null)}
            className="underline font-medium shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: UPLOAD OR EDIT FORM */}
      {activeTab === 'upload' && (
        <form
          onSubmit={handlePublishOrUpdate}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {editingResource
                  ? `Edit Resource: ${editingResource.subjectCode}`
                  : 'Upload New Academic Document'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All fields are validated against duplicate entries and cataloged
                separately from binary files.
              </p>
            </div>
            {editingResource && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Resource Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="question_paper">Previous-Year Question Paper</option>
                <option value="lab_manual">Laboratory Manual</option>
                <option value="syllabus">Curriculum Syllabus</option>
                <option value="study_material">Additional Study Material</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject Code * (e.g. 26MAB1001T, 26CSE1002J, 26EEE1001T)
              </label>
              <input
                type="text"
                required
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                placeholder="26MAB1001T"
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Calculus and Linear Algebra"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Calculus and Linear Algebra — Degree Examination (May 2025)"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department / Branch *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Academic Year *
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Regulation Scheme *
              </label>
              <select
                value={regulation}
                onChange={(e) => setRegulation(e.target.value as RegulationScheme)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              >
                {REGULATIONS.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* Category-Specific Field */}
            {category === 'question_paper' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Examination Type *
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as ExamType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {category === 'lab_manual' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Laboratory Name & Room
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="Programming for Problem Solving (eLab) Laboratory / EEE Practice Lab"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            )}

            {category === 'syllabus' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Syllabus Status
                </label>
                <select
                  value={isCurrentSyllabus ? 'CURRENT' : 'ARCHIVED'}
                  onChange={(e) =>
                    setIsCurrentSyllabus(e.target.value === 'CURRENT')
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="CURRENT">Current Active Curriculum</option>
                  <option value="ARCHIVED">Archived Legacy Curriculum</option>
                </select>
              </div>
            )}

            {category === 'study_material' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Material Classification
                </label>
                <select
                  value={materialSubType}
                  onChange={(e) =>
                    setMaterialSubType(e.target.value as StudyMaterialSubType)
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  {STUDY_MATERIAL_SUBTYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Overview / Summary
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of units covered, exam duration, or laboratory apparatus requirements..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Key Questions / Lab Experiments / Syllabus Units (One per line for
                Structured Preview)
              </label>
              <textarea
                rows={3}
                value={questionsOrUnitsText}
                onChange={(e) => setQuestionsOrUnitsText(e.target.value)}
                placeholder={
                  'Unit 1: Matrices, Eigenvalues and Orthogonal Reduction\nUnit 2: Functions of Several Variables and Jacobians'
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedFile
                    ? `Selected File: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                    : editingResource
                      ? `Current File: ${editingResource.fileName} (${editingResource.fileSizeFormatted})`
                      : 'Attach Official Document File (PDF, DOCX, PPTX, ZIP — Max 25 MB)'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  If no external PDF is selected, CampusVault automatically compiles
                  a downloadable PDF from the structured fields above.
                </p>
              </div>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>{selectedFile || editingResource ? 'Replace File' : 'Choose File'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.zip"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Validating & indexing academic metadata...</span>
                <span className="font-mono tabular-nums">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons: Preview Before Publishing + Publish */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                const draft = buildDraftResource();
                onPreviewResource(draft);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Before Publishing</span>
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>
                {editingResource ? 'Save Changes' : 'Publish to CampusVault'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MANAGE CATALOG INVENTORY */}
      {activeTab === 'manage' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search catalog by code, title, or department..."
                className="w-full sm:w-72 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
              <select
                value={adminCategoryFilter}
                onChange={(e) => setAdminCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="ALL">All Categories</option>
                <option value="question_paper">Question Papers</option>
                <option value="lab_manual">Lab Manuals</option>
                <option value="syllabus">Syllabi</option>
                <option value="study_material">Study Materials</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetToSampleCatalog}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg"
              >
                Restore Default Sample Catalog
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('upload');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Document</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 pl-5 pr-3">Code</th>
                  <th className="py-3 px-3">Title & Category</th>
                  <th className="py-3 px-3">Dept / Sem / Scheme</th>
                  <th className="py-3 px-3 text-right">Access Stats</th>
                  <th className="py-3 pl-3 pr-5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-xs">
                {filteredAdminResources.map((res) => (
                  <tr
                    key={res.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3.5 pl-5 pr-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {res.subjectCode}
                    </td>
                    <td className="py-3.5 px-3 max-w-sm">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {res.title}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {getCategoryLabel(res.category)}
                        {res.examType ? ` · ${res.examType}` : ''}
                        {res.category === 'syllabus'
                          ? res.isArchived
                            ? ' · Archived Syllabus'
                            : ' · Current Active Syllabus'
                          : ''}{' '}
                        · {res.fileFormat} ({res.fileSizeFormatted})
                      </p>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {res.department} · Sem {res.semester} ·{' '}
                      <span className="font-mono">{res.regulation}</span> (
                      <span className="font-mono">{res.academicYear}</span>)
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {res.sessionViews} views · {res.sessionDownloads} downloads
                    </td>
                    <td className="py-3.5 pl-3 pr-5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPreviewResource(res)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                          title="Preview document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {res.category === 'syllabus' && (
                          <button
                            type="button"
                            onClick={() => toggleSyllabusArchiveStatus(res)}
                            className="px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md inline-flex items-center gap-1"
                            title="Toggle Current vs Archived syllabus status"
                          >
                            <Archive className="w-3 h-3" />
                            <span>
                              {res.isArchived ? 'Mark Current' : 'Archive'}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditing(res)}
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md"
                          title="Edit metadata or replace file"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setResourceToDelete(res)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md"
                          title="Delete resource"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INSTITUTION BRANDING CUSTOMIZER */}
      {activeTab === 'branding' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateBranding(brandForm);
            setBrandSavedMsg(true);
            setTimeout(() => setBrandSavedMsg(false), 3000);
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-2xl space-y-4"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Customize Institution Identity & Branding
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize the platform name (default: CampusVault), college title,
              monogram badge, and default regulation scheme.
            </p>
          </div>

          {brandSavedMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
              Institution branding updated across the platform.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Portal Brand Name
              </label>
              <input
                type="text"
                required
                value={brandForm.hubName}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, hubName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Logo Monogram (2–3 chars)
              </label>
              <input
                type="text"
                required
                maxLength={3}
                value={brandForm.logoMonogram}
                onChange={(e) =>
                  setBrandForm({
                    ...brandForm,
                    logoMonogram: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                College / University Official Name
              </label>
              <input
                type="text"
                required
                value={brandForm.institutionName}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, institutionName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Default Active Regulation
              </label>
              <select
                value={brandForm.defaultRegulation}
                onChange={(e) =>
                  setBrandForm({
                    ...brandForm,
                    defaultRegulation: e.target.value as RegulationScheme,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              >
                {REGULATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Academic Helpdesk Email
              </label>
              <input
                type="email"
                required
                value={brandForm.supportEmail}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, supportEmail: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
            >
              Save Institution Branding
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Dialog for Destructive Delete Action */}
      {resourceToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setResourceToDelete(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Delete Academic Resource?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently remove{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {resourceToDelete.subjectCode} — {resourceToDelete.title}
                  </strong>{' '}
                  from the repository? Students will no longer be able to view or
                  download this file.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setResourceToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteResource(resourceToDelete.id);
                  setResourceToDelete(null);
                  setFormFeedback({
                    type: 'success',
                    message: `Deleted "${resourceToDelete.title}" from the catalog.`,
                  });
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
