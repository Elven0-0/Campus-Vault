export type ResourceCategory =
  | 'question_paper'
  | 'lab_manual'
  | 'syllabus'
  | 'study_material';

export type ExamType =
  | 'Internal Assessment'
  | 'Mid-Semester'
  | 'End-Semester'
  | 'Model Exam'
  | 'Supplementary';

export type StudyMaterialSubType =
  | 'Lecture Notes'
  | 'Reference Material'
  | 'Practical Record'
  | 'Model Question Paper';

export type RegulationScheme = 'R2024' | 'R2021' | 'R2019';

export type FileFormat = 'PDF' | 'DOCX' | 'PPTX' | 'ZIP';

export interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description: string;
}

export interface AcademicResource {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  department: string; // Department code e.g. 'CSE', 'ECE'
  semester: number; // 1 to 8
  academicYear: string; // e.g. '2025-26', '2024-25'
  regulation: RegulationScheme;
  category: ResourceCategory;
  // Category-specific fields
  examType?: ExamType;
  labName?: string;
  experimentCount?: number;
  materialSubType?: StudyMaterialSubType;
  isCurrentSyllabus?: boolean;
  isArchived?: boolean;
  // File metadata
  fileFormat: FileFormat;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  fileName: string;
  lastUpdated: string; // YYYY-MM-DD
  uploadedBy: string;
  // Content preview & storage
  summary: string;
  contentSections: {
    heading: string;
    body: string[];
  }[];
  customFileUrl?: string; // Blob URL or Data URL for admin-uploaded files
  isSampleData: boolean;
  sessionViews: number;
  sessionDownloads: number;
}

export type ActiveSection =
  | 'home'
  | 'question_papers'
  | 'lab_manuals'
  | 'syllabus'
  | 'study_materials'
  | 'admin';

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'title_asc'
  | 'title_desc'
  | 'code_asc'
  | 'most_accessed';

export interface ResourceFilterState {
  searchQuery: string;
  department: string; // 'ALL' or department code
  semester: string; // 'ALL' or '1'..'8'
  academicYear: string; // 'ALL' or '2025-26' etc.
  regulation: string; // 'ALL' or RegulationScheme
  examType: string; // 'ALL' or ExamType
  labName: string; // 'ALL' or specific lab
  materialSubType: string; // 'ALL' or StudyMaterialSubType
  syllabusStatus: 'ALL' | 'CURRENT' | 'ARCHIVED';
  sortBy: SortOption;
}

export interface InstitutionBranding {
  hubName: string;
  institutionName: string;
  institutionSubtitle: string;
  logoMonogram: string;
  defaultRegulation: RegulationScheme;
  supportEmail: string;
}
