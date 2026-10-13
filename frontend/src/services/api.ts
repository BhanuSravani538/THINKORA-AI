import { DocumentItem, ResearchWorkspace, User, AuthResponse } from '../types';

/**
 * Resolves the API Base URL.
 * In development, defaults to local backend at http://localhost:5000 (or relative '/api' proxied by Vite).
 * In production (Vercel), defaults to the deployed Render backend URL.
 */
export function getApiBaseUrl(): string {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const proc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
  const isDev = metaEnv?.DEV ?? (proc?.env?.NODE_ENV !== 'production');
  const envUrl =
    (metaEnv?.VITE_API_URL as string | undefined)?.trim() ||
    (proc?.env?.VITE_API_URL as string | undefined)?.trim();

  // If running in development mode (localhost)
  if (isDev) {
    if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1') || envUrl.startsWith('http://'))) {
      const cleanUrl = envUrl.replace(/\/+$/, '');
      return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
    }
    // In Node test runs outside browser, default to localhost:5000/api
    if (typeof window === 'undefined') {
      return 'http://127.0.0.1:5000/api';
    }
    // Default to relative '/api' proxied to local backend
    return '/api';
  }

  // In production builds (Vercel)
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return 'https://thinkora-ai-k7k5.onrender.com/api';
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
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('token') || localStorage.getItem('auth_token')
      : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Safely parses response body as JSON.
 * If response is HTML or plain text (e.g. reverse proxy errors), extracts meaningful error.
 */
async function parseJsonResponse(response: Response): Promise<any> {
  let rawText = '';
  try {
    rawText = await response.text();
  } catch {
    return { error: response.statusText || `HTTP ${response.status}` };
  }

  if (!rawText || !rawText.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    // If not JSON, extract clean message from HTML or status code
    const titleMatch = rawText.match(/<title>([^<]+)<\/title>/i);
    const h1Match = rawText.match(/<h1>([^<]+)<\/h1>/i);
    const cleanError =
      (titleMatch && titleMatch[1].trim()) ||
      (h1Match && h1Match[1].trim()) ||
      (response.statusText && response.statusText.trim()) ||
      `Server returned HTTP ${response.status}`;

    return {
      error: cleanError,
      isHtmlResponse: true,
      rawBody: rawText.slice(0, 300),
    };
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
    const headers = getAuthHeaders();
    const apiBase = getApiBaseUrl();

    let response: Response;
    try {
      response = await fetch(`${apiBase}/workspaces/${workspaceId}/documents/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch (networkErr: any) {
      throw new ApiError(
        `Network error: Unable to reach backend at ${apiBase}. If running locally, make sure your backend is started with "npm start" on port 5000. (${networkErr.message})`,
        503
      );
    }

    // 4. Handle HTTP Response
    const data = await parseJsonResponse(response);

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
      if (response.status === 502) {
        throw new ApiError(
          'Backend is currently unavailable or spinning up (502 Bad Gateway). Please ensure the backend is running locally with "npm start" or wait for Render to initialize.',
          502
        );
      }
      if (response.status === 504) {
        throw new ApiError('Gateway timeout (504): Document processing took longer than expected.', 504);
      }

      throw new ApiError(
        data.error || `Server error (${response.status}) occurred while processing the document.`,
        response.status
      );
    }

    if (!data || !data.data) {
      throw new ApiError(
        data?.message || `Server responded with HTTP ${response.status} but did not return document data.`,
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

      const json = await parseJsonResponse(response);

      if (!response.ok) {
        throw new ApiError(json.error || `Failed to fetch workspaces (${response.status})`, response.status);
      }

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

    const data = await parseJsonResponse(response);
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
      const data = await parseJsonResponse(response);
      throw new ApiError(data.error || `Failed to delete workspace (${response.status})`, response.status);
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
      return await parseJsonResponse(res);
    } catch (err: any) {
      return { status: 'offline', error: err.message, apiBase };
    }
  },

  /**
   * Authenticate user with email and password
   */
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const apiBase = getApiBaseUrl();
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new ApiError(data.error || 'Invalid email or password credentials provided.', response.status, data.details);
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('thinkora_user', JSON.stringify(data.user));
      }
    }
    return data;
  },

  /**
   * Register a new user account
   */
  async register(payload: {
    email: string;
    password: string;
    fullName: string;
    role?: string;
  }): Promise<AuthResponse> {
    const apiBase = getApiBaseUrl();
    const response = await fetch(`${apiBase}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new ApiError(data.error || 'Registration failed. Please check your details.', response.status, data.details);
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('thinkora_user', JSON.stringify(data.user));
      }
    }
    return data;
  },

  /**
   * Fetch currently authenticated user profile
   */
  async getCurrentUser(): Promise<User | null> {
    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('token') || localStorage.getItem('auth_token')
        : null;
    if (!token) return null;

    const apiBase = getApiBaseUrl();
    try {
      const response = await fetch(`${apiBase}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token is expired or invalid
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('thinkora_user');
          }
          return null;
        }
        throw new ApiError('Failed to fetch user profile', response.status);
      }

      const data = await parseJsonResponse(response);
      if (data.user) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('thinkora_user', JSON.stringify(data.user));
        }
        return data.user;
      }
      return null;
    } catch (err: any) {
      // If network fails temporarily, attempt fallback to cached user
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('thinkora_user') : null;
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore parsing error
        }
      }
      return null;
    }
  },

  /**
   * Log out and clear stored session tokens
   */
  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('thinkora_user');
    }
  },
};

