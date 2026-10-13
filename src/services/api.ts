import { DocumentItem } from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const api = {
  /**
   * Upload a PDF evidence document to the active workspace.
   * Uses browser FormData. Content-Type header is left to the browser to attach boundary.
   */
  async uploadDocumentPdf(
    workspaceId: string,
    file: File,
    meta?: { title?: string; author?: string; summary?: string }
  ): Promise<DocumentItem> {
    // 1. Client-side Preflight Validation
    if (!file) {
      throw new ApiError('No file selected. Please select a PDF file to upload.', 400);
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      throw new ApiError(
        `Unsupported file type "${file.type || 'unknown'}". Only PDF documents (.pdf) are supported.`,
        400
      );
    }

    const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new ApiError(
        `File size (${sizeMB} MB) exceeds maximum allowed limit of 50 MB.`,
        413
      );
    }

    // 2. Build FormData payload
    const formData = new FormData();
    formData.append('file', file);

    if (meta?.title?.trim()) {
      formData.append('title', meta.title.trim());
    }
    if (meta?.author?.trim()) {
      formData.append('author', meta.author.trim());
    }
    if (meta?.summary?.trim()) {
      formData.append('summary', meta.summary.trim());
    }

    // 3. Dispatch to Backend REST Endpoint
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('auth_token')) : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/workspaces/${workspaceId}/documents/upload`, {
        method: 'POST',
        headers,
        body: formData,
        // IMPORTANT: Do NOT manually set Content-Type header when using FormData;
        // the browser must set 'multipart/form-data; boundary=...' automatically.
      });
    } catch (networkErr: any) {
      throw new ApiError(
        `Network error: Unable to reach the THINKORA backend server. Please verify the server is running. (${networkErr.message})`,
        503
      );
    }

    // 4. Handle HTTP Response
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { error: response.statusText || 'Unexpected server response format' };
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError('Unauthorized: Authentication required to upload evidence documents.', 401);
      }
      if (response.status === 413) {
        throw new ApiError('File too large: The server rejected the file because it exceeds 50MB.', 413);
      }
      if (response.status === 400) {
        const message = data.error || (data.details ? JSON.stringify(data.details) : 'Validation failed for uploaded file.');
        throw new ApiError(message, 400, data.details);
      }
      if (response.status === 404) {
        throw new ApiError(`Target research workspace "${workspaceId}" was not found.`, 404);
      }

      throw new ApiError(
        data.error || `Server error (${response.status}) occurred while processing the document.`,
        response.status
      );
    }

    return data.data as DocumentItem;
  },

  /**
   * Diagnostic health-check probe
   */
  async checkHealth(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (err: any) {
      return { status: 'offline', error: err.message };
    }
  },
};
