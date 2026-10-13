import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Ensures the persistent Supabase Storage bucket 'evidence-documents' exists.
 */
export async function ensureEvidenceBucket(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) {
      console.warn('⚠️ Could not list Supabase storage buckets:', listErr.message);
      return false;
    }
    const exists = buckets?.some(b => b.name === 'evidence-documents');
    if (!exists) {
      const { error: createErr } = await supabase.storage.createBucket('evidence-documents', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf'],
      });
      if (createErr) {
        console.warn('⚠️ Could not auto-create evidence-documents bucket in Supabase:', createErr.message);
        return false;
      }
      console.log('✅ Created Supabase Storage bucket: evidence-documents');
    }
    return true;
  } catch (err: any) {
    console.warn('⚠️ Exception verifying evidence bucket:', err?.message);
    return false;
  }
}

export interface StoredFileInfo {
  fileName: string;
  storageProvider: 'supabase' | 'local';
  storagePath: string;
  fileSizeBytes: number;
}


/**
 * Persists an uploaded PDF file either to Supabase Storage (if configured)
 * or to the local server/uploads persistent directory with resilient fallback.
 */
export async function persistUploadedFile(
  workspaceId: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<StoredFileInfo> {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const remotePath = `${workspaceId}/${timestamp}_${sanitizedFileName}`;

  // 1. Attempt Supabase Storage if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('evidence-documents')
        .upload(remotePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!error && data) {
        return {
          fileName,
          storageProvider: 'supabase',
          storagePath: data.path,
          fileSizeBytes: fileBuffer.length,
        };
      }
      console.warn('⚠️ Supabase Storage bucket upload returned error, falling back to local persistent disk:', error?.message);
    } catch (err: any) {
      console.warn('⚠️ Supabase Storage failed, falling back to local persistent disk:', err?.message || err);
    }
  }

  // 2. Local persistent disk storage
  const workspaceUploadDir = path.join(UPLOADS_DIR, workspaceId);
  if (!fs.existsSync(workspaceUploadDir)) {
    fs.mkdirSync(workspaceUploadDir, { recursive: true });
  }

  const localFilePath = path.join(workspaceUploadDir, `${timestamp}_${sanitizedFileName}`);
  fs.writeFileSync(localFilePath, fileBuffer);

  return {
    fileName,
    storageProvider: 'local',
    storagePath: path.relative(path.resolve(__dirname, '..'), localFilePath).replace(/\\/g, '/'),
    fileSizeBytes: fileBuffer.length,
  };
}

/**
 * Retrieves the raw file buffer from storage
 */
export async function getStoredFileBuffer(
  storageProvider: 'supabase' | 'local',
  storagePath: string
): Promise<Buffer | null> {
  if (storageProvider === 'supabase' && isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('evidence-documents')
        .download(storagePath);
      if (!error && data) {
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (err) {
      console.error('Failed to download from Supabase Storage:', err);
    }
  }

  // Read from local filesystem
  const absolutePath = path.resolve(__dirname, '..', storagePath);
  if (fs.existsSync(absolutePath)) {
    return fs.readFileSync(absolutePath);
  }

  return null;
}
