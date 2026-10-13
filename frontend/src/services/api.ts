import { DocumentItem, ResearchWorkspace } from '../types';

/**
 * Resolves the API Base URL.
 * In production (Vercel), uses import.meta.env.VITE_API_URL pointing to the deployed Render backend.
 * In development, falls back to relative '/api' proxied by Vite to http://localhost:5000.
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return '/api';
}

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

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token') || localStorage.getItem('auth_token')
      : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
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
    const headers = getAuthHeaders();
    const apiBase = getApiBaseUrl();

    let response: Response;
    try {
      response = await fetch(`${apiBase}/workspaces/${workspaceId}/documents/upload`, {
        method: 'POST',
        headers,
        body: formData,
        // IMPORTANT: Do NOT manually set Content-Type header when using FormData;
        // the browser must set 'multipart/form-data; boundary=...' automatically.
      });
    } catch (networkErr: any) {
      throw new ApiError(
        `Network error: Unable to reach the THINKORA backend server at ${apiBase}. Please verify the server is running and CORS is configured. (${networkErr.message})`,
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
        const message = data.error || `Target research workspace "${workspaceId}" was not found or access is unauthorized.`;
        throw new ApiError(message, 404);
      }

      throw new ApiError(
        data.error || `Server error (${response.status}) occurred while processing the document.`,
        response.status
      );
    }

    return data.data as DocumentItem;
  },

  /**
   * Fetch all workspaces accessible by the current user.
   */
  async listWorkspaces(): Promise<ResearchWorkspace[]> {
    const apiBase = getApiBaseUrl();
    const headers = getAuthHeaders();

    try {
      const response = await fetch(`${apiBase}/workspaces`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(errorData.error || `Failed to fetch workspaces (${response.status})`, response.status);
      }

      const json = await response.json();
      return (json.data || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        description: w.description || '',
        domain: w.domain || 'Enterprise Infrastructure',
        status: w.status || 'active',
        createdAt: w.createdAt ? w.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        lastActive: 'Recently',
        owner: w.owner || 'Dr. Elena Rostova',
        tags: w.tags || [],
        completionPercentage: w.completionPercentage || 0,
        confidenceGrade: w.confidenceGrade || 'B',
        documentsCount: w.documentsCount || 0,
        claimsCount: w.claimsCount || 0,
        contradictionsCount: w.contradictionsCount || 0,
        decisionGoal: w.decisionGoal || '',
      }));
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(`Network error fetching workspaces: ${err.message}`, 503);
    }
  },

  /**
   * Create a new research workspace in persistent storage.
   */
  async createWorkspace(payload: {
    name: string;
    domain: string;
    description: string;
    decisionGoal: string;
    status?: string;
    tags?: string[];
  }): Promise<ResearchWorkspace> {
    const apiBase = getApiBaseUrl();
    const headers = getAuthHeaders();

    const response = await fetch(`${apiBase}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        name: payload.name,
        domain: payload.domain,
        description: payload.description,
        decisionGoal: payload.decisionGoal,
        status: payload.status || 'active',
        tags: payload.tags || ['Active-Research'],
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(data.error || 'Failed to create workspace on server', response.status, data.details);
    }

    const w = data.data;
    return {
      id: w.id,
      name: w.name,
      description: w.description || '',
      domain: w.domain || payload.domain,
      status: w.status || 'active',
      createdAt: w.createdAt ? w.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      owner: payload.name,
      tags: w.tags || payload.tags || [],
      completionPercentage: w.completionPercentage || 15,
      confidenceGrade: w.confidenceGrade || 'B',
      documentsCount: w.documentsCount || 0,
      claimsCount: w.claimsCount || 0,
      contradictionsCount: w.contradictionsCount || 0,
      decisionGoal: w.decisionGoal || payload.decisionGoal,
    };
  },

  /**
   * Delete a research workspace.
   */
  async deleteWorkspace(workspaceId: string): Promise<boolean> {
    const apiBase = getApiBaseUrl();
    const headers = getAuthHeaders();

    const response = await fetch(`${apiBase}/workspaces/${workspaceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(data.error || 'Failed to delete workspace', response.status);
    }

    return true;
  },

  /**
   * Diagnostic health-check probe
   */
  async checkHealth(): Promise<any> {
    const apiBase = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBase}/health`);
      return await res.json();
    } catch (err: any) {
      return { status: 'offline', error: err.message, apiBase };
    }
  },
};

