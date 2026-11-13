import {
  AcademicResource,
  FileFormat,
  InstitutionBranding,
} from '../types/academic';
import { DEFAULT_BRANDING, SAMPLE_RESOURCES } from '../data/sampleResources';

const METADATA_STORAGE_KEY = 'campusvault_resources_metadata_v6';
const BRANDING_STORAGE_KEY = 'campusvault_branding_v2';
const ADMIN_SESSION_KEY = 'campusvault_admin_session_v1';

// Separate file binary/blob registry so file payloads are decoupled from metadata
const fileBlobRegistry = new Map<string, string>();

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function detectFileFormat(fileName: string): FileFormat {
  const ext = fileName.split('.').pop()?.toUpperCase();
  if (ext === 'DOCX' || ext === 'DOC') return 'DOCX';
  if (ext === 'PPTX' || ext === 'PPT') return 'PPTX';
  if (ext === 'ZIP' || ext === 'RAR') return 'ZIP';
  return 'PDF';
}

export function loadResourcesFromStorage(): AcademicResource[] {
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(SAMPLE_RESOURCES));
      return SAMPLE_RESOURCES;
    }
    const parsed = JSON.parse(raw) as AcademicResource[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SAMPLE_RESOURCES;
    }
    const sampleIds = new Set(SAMPLE_RESOURCES.map((s) => s.id));
    // Keep only current SAMPLE_RESOURCES or custom admin-created entries (id starting with 'res-')
    const validStored = parsed.filter(
      (item) => sampleIds.has(item.id) || item.id.startsWith('res-')
    );
    const existingIds = new Set(validStored.map((item) => item.id));
    const missingDefaults = SAMPLE_RESOURCES.filter(
      (sample) => !existingIds.has(sample.id)
    );
    const combined = [...missingDefaults, ...validStored];

    return combined.map((res) => {
      const sampleMatch = SAMPLE_RESOURCES.find((s) => s.id === res.id);
      return {
        ...res,
        customFileUrl:
          fileBlobRegistry.get(res.id) ||
          res.customFileUrl ||
          sampleMatch?.customFileUrl,
      };
    });
  } catch {
    return SAMPLE_RESOURCES;
  }
}

export function saveResourcesToStorage(resources: AcademicResource[]): void {
  try {
    // Store metadata separately from large blob URLs
    const metadataOnly = resources.map((item) => {
      if (item.customFileUrl) {
        fileBlobRegistry.set(item.id, item.customFileUrl);
      }
      const { customFileUrl, ...rest } = item;
      // Keep data URL only if small enough for localStorage, otherwise keep in memory registry
      const safeCustomUrl =
        customFileUrl && customFileUrl.length < 180000 ? customFileUrl : undefined;
      return {
        ...rest,
        customFileUrl: safeCustomUrl,
      };
    });
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(metadataOnly));
  } catch (err) {
    console.error('Failed to persist resource metadata:', err);
  }
}

export function registerUploadedFile(resourceId: string, fileUrl: string): void {
  fileBlobRegistry.set(resourceId, fileUrl);
}

export function getUploadedFileUrl(resourceId: string): string | undefined {
  return fileBlobRegistry.get(resourceId);
}

export function checkDuplicateResource(
  existing: AcademicResource[],
  candidate: {
    subjectCode: string;
    category: string;
    academicYear: string;
    examType?: string;
    regulation: string;
    excludeId?: string;
  }
): AcademicResource | undefined {
  const normCode = candidate.subjectCode.trim().toUpperCase();
  return existing.find((item) => {
    if (candidate.excludeId && item.id === candidate.excludeId) return false;
    const sameSubject = item.subjectCode.trim().toUpperCase() === normCode;
    const sameCategory = item.category === candidate.category;
    const sameYear = item.academicYear === candidate.academicYear;
    const sameReg = item.regulation === candidate.regulation;
    if (candidate.category === 'question_paper') {
      return (
        sameSubject &&
        sameCategory &&
        sameYear &&
        sameReg &&
        item.examType === candidate.examType
      );
    }
    return sameSubject && sameCategory && sameReg && sameYear;
  });
}

export function loadBrandingFromStorage(): InstitutionBranding {
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return DEFAULT_BRANDING;
    return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function saveBrandingToStorage(branding: InstitutionBranding): void {
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
  } catch (err) {
    console.error('Failed to save branding:', err);
  }
}

export function getAdminSession(): { isAuthenticated: boolean; email: string; role: string } {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Ignore storage access errors
  }
  return { isAuthenticated: false, email: '', role: 'student' };
}

export function setAdminSession(_email: string): void {
  // Do not persist admin credentials across page loads
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Ignore storage access errors
  }
}
