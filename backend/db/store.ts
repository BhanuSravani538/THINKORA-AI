import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'local_db.json');

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface WorkspaceRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  domain: string;
  status: 'active' | 'in_review' | 'simulated' | 'decision_ready';
  decisionGoal: string;
  confidenceGrade: string;
  completionPercentage: number;
  tags: string[];
  documentsCount: number;
  claimsCount: number;
  contradictionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  workspaceId: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'xlsx' | 'docx' | 'json';
  author: string;
  summary: string;
  pages: number;
  status: 'completed' | 'processing' | 'extracting' | 'failed';
  tags: string[];
  extractedClaimsCount: number;
  contradictionsCount: number;
  pipelineSteps: {
    ocr: string;
    entityExtraction: string;
    claimTriangulation: string;
    conflictCheck: string;
  };
  storagePath?: string;
  storageProvider?: 'supabase' | 'local';
  createdAt: string;
}

export interface ClaimRecord {
  id: string;
  documentId: string;
  workspaceId: string;
  statement: string;
  confidence: number;
  evidenceType: 'empirical' | 'vendor_sla' | 'third_party_benchmark' | 'internal_audit' | 'expert_opinion';
  status: 'verified' | 'conflicted' | 'unverified';
  quote: string;
  extractedDate: string;
  relatedOptionId?: string;
  tags: string[];
  createdAt?: string;
}

export interface ScenarioRecord {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  description: string;
  constraints: {
    budgetLimit: number;
    maxLatencyMs: number;
    maxSpaceUnits: number;
    requiredCompliance: string;
    maxImplementationMonths: number;
    priorityWeights: Record<string, number>;
  };
  simulationResults: any[];
  createdAt: string;
}

export interface EvidenceRelationshipRecord {
  id: string;
  workspaceId: string;
  sourceClaimId: string;
  targetClaimId?: string;
  relationshipType: 'supports' | 'contradicts' | 'derived_from' | 'refines';
  severity?: 'critical' | 'moderate' | 'low';
  impactNotes?: string;
  resolutionStatus: 'unresolved' | 'investigating' | 'dismissed' | 'resolved';
  createdAt: string;
}

// -----------------------------------------------------------------------------
// In-Memory & Local File Persistent Store
// -----------------------------------------------------------------------------
const memoryUsers: Map<string, UserRecord> = new Map();
const memoryWorkspaces: Map<string, WorkspaceRecord> = new Map();
const memoryDocuments: Map<string, DocumentRecord> = new Map();
const memoryClaims: Map<string, ClaimRecord> = new Map();
const memoryScenarios: Map<string, ScenarioRecord> = new Map();
const memoryOptions: Map<string, any[]> = new Map();
const memoryRelationships: Map<string, EvidenceRelationshipRecord> = new Map();

export const DEFAULT_USER_ID = 'usr-demo-rostova';
export const DEFAULT_WORKSPACE_ID = 'ws-cloud-arch';

function isMissingTableError(error: any): boolean {
  return Boolean(
    error &&
    (error.code === 'PGRST205' ||
     error.code === '42P01' ||
     (typeof error.message === 'string' && error.message.includes('schema cache')))
  );
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveLocalDb() {
  try {
    ensureDataDir();
    const state = {
      users: Array.from(memoryUsers.entries()),
      workspaces: Array.from(memoryWorkspaces.entries()),
      documents: Array.from(memoryDocuments.entries()),
      claims: Array.from(memoryClaims.entries()),
      scenarios: Array.from(memoryScenarios.entries()),
      options: Array.from(memoryOptions.entries()),
      relationships: Array.from(memoryRelationships.entries()),
      lastSaved: new Date().toISOString(),
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.warn('⚠️ Could not save local_db.json:', err);
  }
}

function loadLocalDb() {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const content = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
      const state = JSON.parse(content);
      if (state.users) memoryUsers.clear(), state.users.forEach(([k, v]: any) => memoryUsers.set(k, v));
      if (state.workspaces) memoryWorkspaces.clear(), state.workspaces.forEach(([k, v]: any) => memoryWorkspaces.set(k, v));
      if (state.documents) memoryDocuments.clear(), state.documents.forEach(([k, v]: any) => memoryDocuments.set(k, v));
      if (state.claims) memoryClaims.clear(), state.claims.forEach(([k, v]: any) => memoryClaims.set(k, v));
      if (state.scenarios) memoryScenarios.clear(), state.scenarios.forEach(([k, v]: any) => memoryScenarios.set(k, v));
      if (state.options) memoryOptions.clear(), state.options.forEach(([k, v]: any) => memoryOptions.set(k, v));
      if (state.relationships) memoryRelationships.clear(), state.relationships.forEach(([k, v]: any) => memoryRelationships.set(k, v));
      console.log(`📁 Loaded ${memoryWorkspaces.size} workspaces and ${memoryDocuments.size} documents from local_db.json`);
      return true;
    }
  } catch (err) {
    console.warn('⚠️ Could not load local_db.json, seeding defaults:', err);
  }
  return false;
}

function seedDefaultData() {
  memoryUsers.set(DEFAULT_USER_ID, {
    id: DEFAULT_USER_ID,
    email: 'architect@veritygraph.ai',
    passwordHash: '$2b$10$vlSXHURM4PnJs.d.iHKMBO5JR6ossVb4WBraLVF7AaKqw.7NLAxF2',
    fullName: 'Dr. Elena Rostova',
    role: 'lead_architect',
    createdAt: new Date().toISOString(),
  });

  memoryWorkspaces.set(DEFAULT_WORKSPACE_ID, {
    id: DEFAULT_WORKSPACE_ID,
    userId: DEFAULT_USER_ID,
    name: 'Enterprise Cloud Migration & AI Inference Infrastructure',
    description: 'Evidence-based architectural evaluation comparing multi-region serverless, hybrid Kubernetes bare-metal, and sovereign colocation for 85M daily transactional events.',
    domain: 'Enterprise Infrastructure',
    status: 'simulated',
    decisionGoal: 'Select runtime platform balancing <25ms p99 SLA against $140k/mo budget cap and strict SOC2/HIPAA compliance.',
    confidenceGrade: 'A',
    completionPercentage: 88,
    tags: ['Cloud', 'Kubernetes', 'Serverless', 'FinOps', 'Latency-Critical'],
    documentsCount: 6,
    claimsCount: 34,
    contradictionsCount: 4,
    createdAt: '2026-09-12T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  });

  memoryWorkspaces.set('ws-solar-campus', {
    id: 'ws-solar-campus',
    userId: DEFAULT_USER_ID,
    name: 'Campus Solar Energy Planning & Microgrid Feasibility',
    description: 'Empirical techno-economic assessment evaluating monocrystalline rooftop, bifacial canopy, and thin-film arrays for university net-zero transition.',
    domain: 'Clean Energy & Utilities',
    status: 'decision_ready',
    decisionGoal: 'Select optimal solar PV candidate balancing $140,000 budget, 9,000 sq ft roof space limit, and 650 kWh/day minimum energy demand.',
    confidenceGrade: 'A',
    completionPercentage: 92,
    tags: ['Solar PV', 'Clean Energy', 'Campus Microgrid', 'CapEx'],
    documentsCount: 2,
    claimsCount: 16,
    contradictionsCount: 1,
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  });

  memoryDocuments.set('doc-solar-campus', {
    id: 'doc-solar-campus',
    workspaceId: 'ws-solar-campus',
    title: 'Campus Solar Energy Planning and Microgrid Feasibility Study 2026',
    fileName: 'Campus_Solar_Energy_Planning.pdf',
    fileSize: '3.4 MB',
    fileType: 'pdf',
    author: 'Campus Energy & Sustainability Office',
    summary: 'Comprehensive engineering feasibility assessment evaluating Solar A (Monocrystalline rooftop), Solar B (Bifacial canopy), and Solar C (Thin-film flexible).',
    pages: 38,
    status: 'completed',
    tags: ['Solar Energy', 'Campus Planning', 'Microgrid', 'CapEx'],
    extractedClaimsCount: 12,
    contradictionsCount: 1,
    pipelineSteps: { ocr: 'done', entityExtraction: 'done', claimTriangulation: 'done', conflictCheck: 'done' },
    createdAt: '2026-10-10T00:00:00.000Z',
  });

  memoryClaims.set('cl-101', {
    id: 'cl-101',
    documentId: 'doc-gartner',
    workspaceId: DEFAULT_WORKSPACE_ID,
    statement: 'Managed Serverless architectures incur 3.8x higher egress networking costs once sustained IOPS exceed 45,000 req/sec.',
    confidence: 94,
    evidenceType: 'third_party_benchmark',
    status: 'verified',
    quote: 'At scale (>40k sustained QPS), AWS Lambda and API Gateway data egress charges erode operational margin compared to containerized pods by up to 280%.',
    extractedDate: '2026-10-02',
    tags: ['Cost', 'FinOps', 'Egress'],
  });

  saveLocalDb();
}

// Initialize local store
if (!loadLocalDb()) {
  seedDefaultData();
}

export const dbStore = {
  /**
   * Tests connectivity to configured database
   */
  async testConnection(): Promise<{ connected: boolean; provider: string; details?: string; tablesInitialized?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('users').select('id').limit(1);
        if (!error) {
          return {
            connected: true,
            provider: 'supabase',
            tablesInitialized: true,
            details: 'Supabase PostgreSQL connected and tables initialized.',
          };
        }
        if (isMissingTableError(error)) {
          return {
            connected: true,
            provider: 'supabase',
            tablesInitialized: false,
            details: 'Connected to Supabase project. Tables pending creation: please execute server/db/migrations/002_persistent_storage_and_rls.sql in Supabase Dashboard SQL Editor.',
          };
        }
        return {
          connected: false,
          provider: 'supabase',
          tablesInitialized: false,
          details: `Supabase query failed: ${error.message}`,
        };
      } catch (err: any) {
        return {
          connected: false,
          provider: 'supabase',
          tablesInitialized: false,
          details: `Supabase connection exception: ${err.message}`,
        };
      }
    }
    return {
      connected: true,
      provider: 'local_file',
      tablesInitialized: true,
      details: `Active local file persistence at ${LOCAL_DB_PATH} (${memoryWorkspaces.size} workspaces).`,
    };
  },

  /**
   * Ensures default demonstration workspaces and user exist in persistent database.
   */
  async ensureDefaultWorkspaces(): Promise<void> {
    // 1. Ensure in-memory defaults always populated
    if (!memoryUsers.has(DEFAULT_USER_ID)) {
      memoryUsers.set(DEFAULT_USER_ID, {
        id: DEFAULT_USER_ID,
        email: 'architect@veritygraph.ai',
        passwordHash: '$2b$10$vlSXHURM4PnJs.d.iHKMBO5JR6ossVb4WBraLVF7AaKqw.7NLAxF2',
        fullName: 'Dr. Elena Rostova',
        role: 'lead_architect',
        createdAt: new Date().toISOString(),
      });
    }

    if (!memoryWorkspaces.has('ws-solar-campus')) {
      memoryWorkspaces.set('ws-solar-campus', {
        id: 'ws-solar-campus',
        userId: DEFAULT_USER_ID,
        name: 'Campus Solar Energy Planning & Microgrid Feasibility',
        description: 'Empirical techno-economic assessment evaluating monocrystalline rooftop, bifacial canopy, and thin-film arrays for university net-zero transition.',
        domain: 'Clean Energy & Utilities',
        status: 'decision_ready',
        decisionGoal: 'Select optimal solar PV candidate balancing $140,000 budget, 9,000 sq ft roof space limit, and 650 kWh/day minimum energy demand.',
        confidenceGrade: 'A',
        completionPercentage: 92,
        tags: ['Solar PV', 'Clean Energy', 'Campus Microgrid', 'CapEx'],
        documentsCount: 2,
        claimsCount: 16,
        contradictionsCount: 1,
        createdAt: '2026-10-10T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      });
    }

    if (!memoryWorkspaces.has(DEFAULT_WORKSPACE_ID)) {
      memoryWorkspaces.set(DEFAULT_WORKSPACE_ID, {
        id: DEFAULT_WORKSPACE_ID,
        userId: DEFAULT_USER_ID,
        name: 'Enterprise Cloud Migration & AI Inference Infrastructure',
        description: 'Evidence-based architectural evaluation comparing multi-region serverless, hybrid Kubernetes bare-metal, and sovereign colocation for 85M daily transactional events.',
        domain: 'Enterprise Infrastructure',
        status: 'simulated',
        decisionGoal: 'Select runtime platform balancing <25ms p99 SLA against $140k/mo budget cap and strict SOC2/HIPAA compliance.',
        confidenceGrade: 'A',
        completionPercentage: 88,
        tags: ['Cloud', 'Kubernetes', 'Serverless', 'FinOps', 'Latency-Critical'],
        documentsCount: 6,
        claimsCount: 34,
        contradictionsCount: 4,
        createdAt: '2026-09-12T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. Ensure in Supabase PostgreSQL
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').upsert(
          {
            id: DEFAULT_USER_ID,
            email: 'architect@veritygraph.ai',
            password_hash: '$2b$10$vlSXHURM4PnJs.d.iHKMBO5JR6ossVb4WBraLVF7AaKqw.7NLAxF2',
            full_name: 'Dr. Elena Rostova',
            role: 'lead_architect',
          },
          { onConflict: 'id' }
        );

        const defaults = [
          {
            id: 'ws-solar-campus',
            user_id: DEFAULT_USER_ID,
            name: 'Campus Solar Energy Planning & Microgrid Feasibility',
            description: 'Empirical techno-economic assessment evaluating monocrystalline rooftop, bifacial canopy, and thin-film arrays for university net-zero transition.',
            domain: 'Clean Energy & Utilities',
            status: 'decision_ready',
            decision_goal: 'Select optimal solar PV candidate balancing $140,000 budget, 9,000 sq ft roof space limit, and 650 kWh/day minimum energy demand.',
            confidence_grade: 'A',
            completion_percentage: 92,
            tags: ['Solar PV', 'Clean Energy', 'Campus Microgrid', 'CapEx'],
            documents_count: 2,
            claims_count: 16,
            contradictions_count: 1,
          },
          {
            id: DEFAULT_WORKSPACE_ID,
            user_id: DEFAULT_USER_ID,
            name: 'Enterprise Cloud Migration & AI Inference Infrastructure',
            description: 'Evidence-based architectural evaluation comparing multi-region serverless, hybrid Kubernetes bare-metal, and sovereign colocation for 85M daily transactional events.',
            domain: 'Enterprise Infrastructure',
            status: 'simulated',
            decision_goal: 'Select runtime platform balancing <25ms p99 SLA against $140k/mo budget cap and strict SOC2/HIPAA compliance.',
            confidence_grade: 'A',
            completion_percentage: 88,
            tags: ['Cloud', 'Kubernetes', 'Serverless', 'FinOps', 'Latency-Critical'],
            documents_count: 6,
            claims_count: 34,
            contradictions_count: 4,
          },
        ];

        for (const ws of defaults) {
          await supabase.from('research_workspaces').upsert(ws, { onConflict: 'id' });
        }
      } catch (err: any) {
        console.warn('⚠️ Supabase ensureDefaultWorkspaces warning:', err?.message || err);
      }
    }
  },

  /**
   * Initializes persistent database and ensures default demo state.
   */
  async initStore(): Promise<void> {
    const conn = await dbStore.testConnection();
    console.log(`📡 Database provider: ${conn.provider} (${conn.connected ? 'Connected' : 'Disconnected'})`);
    await dbStore.ensureDefaultWorkspaces();
  },

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through to memory
        } else {
          console.error('Supabase findUserByEmail error:', error.message);
          throw new Error(`Database error looking up user: ${error.message}`);
        }
      } else if (data) {
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          fullName: data.full_name,
          role: data.role,
          createdAt: data.created_at,
        };
      } else {
        return null;
      }
    }

    for (const user of memoryUsers.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase findUserById error:', error.message);
          throw new Error(`Database error looking up user: ${error.message}`);
        }
      } else if (data) {
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          fullName: data.full_name,
          role: data.role,
          createdAt: data.created_at,
        };
      } else {
        return null;
      }
    }

    return memoryUsers.get(id) || null;
  },

  async createUser(user: Omit<UserRecord, 'id' | 'createdAt'>): Promise<UserRecord> {
    const id = `usr-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newRecord: UserRecord = { ...user, id, createdAt };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id,
          email: user.email.toLowerCase(),
          password_hash: user.passwordHash,
          full_name: user.fullName,
          role: user.role,
        })
        .select()
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through to local
        } else {
          console.error('Supabase createUser error:', error.message);
          throw new Error(`Database error creating user: ${error.message}`);
        }
      } else {
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          fullName: data.full_name,
          role: data.role,
          createdAt: data.created_at,
        };
      }
    }

    memoryUsers.set(id, newRecord);
    saveLocalDb();
    return newRecord;
  },

  // ---------------------------------------------------------------------------
  // WORKSPACES (With User-Level Isolation)
  // ---------------------------------------------------------------------------
  async listWorkspaces(userId?: string): Promise<WorkspaceRecord[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('research_workspaces').select('*');
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.eq.${DEFAULT_USER_ID}`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Supabase listWorkspaces error, falling back to local memory store:', error.message);
        // Fall through to memory
      } else {
        return (data || []).map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          name: d.name,
          description: d.description,
          domain: d.domain,
          status: d.status,
          decisionGoal: d.decision_goal,
          confidenceGrade: d.confidence_grade,
          completionPercentage: d.completion_percentage,
          tags: d.tags || [],
          documentsCount: d.documents_count || 0,
          claimsCount: d.claims_count || 0,
          contradictionsCount: d.contradictions_count || 0,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }

    return Array.from(memoryWorkspaces.values()).filter(
      w => !userId || w.userId === userId || w.userId === DEFAULT_USER_ID
    );
  },

  async getWorkspaceById(id: string, requestingUserId?: string): Promise<WorkspaceRecord | null> {
    if (isSupabaseConfigured && supabase) {
      let { data, error } = await supabase
        .from('research_workspaces')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!data && (id === 'ws-solar-campus' || id === DEFAULT_WORKSPACE_ID)) {
        await dbStore.ensureDefaultWorkspaces();
        const retry = await supabase
          .from('research_workspaces')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (retry.data) {
          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase getWorkspaceById error:', error.message);
          throw new Error(`Database error fetching workspace: ${error.message}`);
        }
      } else if (data) {
        if (requestingUserId && data.user_id !== requestingUserId && data.user_id !== DEFAULT_USER_ID) {
          return null; // Restricted access
        }

        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          description: data.description,
          domain: data.domain,
          status: data.status,
          decisionGoal: data.decision_goal,
          confidenceGrade: data.confidence_grade,
          completionPercentage: data.completion_percentage,
          tags: data.tags || [],
          documentsCount: data.documents_count || 0,
          claimsCount: data.claims_count || 0,
          contradictionsCount: data.contradictions_count || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      } else {
        return null;
      }
    }

    const ws = memoryWorkspaces.get(id);
    if (!ws) return null;
    if (requestingUserId && ws.userId !== requestingUserId && ws.userId !== DEFAULT_USER_ID) {
      return null;
    }
    return ws;
  },

  async createWorkspace(workspace: Omit<WorkspaceRecord, 'id' | 'createdAt' | 'updatedAt' | 'documentsCount' | 'claimsCount' | 'contradictionsCount'>): Promise<WorkspaceRecord> {
    const id = `ws-${Date.now()}`;
    const now = new Date().toISOString();
    const newRecord: WorkspaceRecord = {
      ...workspace,
      id,
      documentsCount: 0,
      claimsCount: 0,
      contradictionsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('research_workspaces')
        .insert({
          id,
          user_id: workspace.userId,
          name: workspace.name,
          description: workspace.description,
          domain: workspace.domain,
          status: workspace.status,
          decision_goal: workspace.decisionGoal,
          confidence_grade: workspace.confidenceGrade,
          completion_percentage: workspace.completionPercentage,
          tags: workspace.tags,
          documents_count: 0,
          claims_count: 0,
          contradictions_count: 0,
        })
        .select()
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through to local
        } else {
          console.error('Supabase createWorkspace error:', error.message);
          throw new Error(`Database error creating workspace: ${error.message}`);
        }
      } else {
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          description: data.description,
          domain: data.domain,
          status: data.status,
          decisionGoal: data.decision_goal,
          confidenceGrade: data.confidence_grade,
          completionPercentage: data.completion_percentage,
          tags: data.tags,
          documentsCount: 0,
          claimsCount: 0,
          contradictionsCount: 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }

    memoryWorkspaces.set(id, newRecord);
    saveLocalDb();
    return newRecord;
  },

  async updateWorkspace(id: string, updates: Partial<WorkspaceRecord>, requestingUserId?: string): Promise<WorkspaceRecord | null> {
    if (isSupabaseConfigured && supabase) {
      const existing = await this.getWorkspaceById(id, requestingUserId);
      if (!existing) return null;

      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.domain !== undefined) payload.domain = updates.domain;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.decisionGoal !== undefined) payload.decision_goal = updates.decisionGoal;
      if (updates.confidenceGrade !== undefined) payload.confidence_grade = updates.confidenceGrade;
      if (updates.completionPercentage !== undefined) payload.completion_percentage = updates.completionPercentage;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.documentsCount !== undefined) payload.documents_count = updates.documentsCount;
      if (updates.claimsCount !== undefined) payload.claims_count = updates.claimsCount;
      if (updates.contradictionsCount !== undefined) payload.contradictions_count = updates.contradictionsCount;

      const { data, error } = await supabase
        .from('research_workspaces')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase updateWorkspace error:', error.message);
          throw new Error(`Database error updating workspace: ${error.message}`);
        }
      } else {
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          description: data.description,
          domain: data.domain,
          status: data.status,
          decisionGoal: data.decision_goal,
          confidenceGrade: data.confidence_grade,
          completionPercentage: data.completion_percentage,
          tags: data.tags || [],
          documentsCount: data.documents_count || 0,
          claimsCount: data.claims_count || 0,
          contradictionsCount: data.contradictions_count || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }

    const existing = memoryWorkspaces.get(id);
    if (!existing) return null;
    if (requestingUserId && existing.userId !== requestingUserId && existing.userId !== DEFAULT_USER_ID) {
      return null;
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    memoryWorkspaces.set(id, updated);
    saveLocalDb();
    return updated;
  },

  async deleteWorkspace(id: string, requestingUserId?: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const existing = await this.getWorkspaceById(id, requestingUserId);
      if (!existing) return false;

      let query = supabase.from('research_workspaces').delete().eq('id', id);
      if (requestingUserId) {
        query = query.eq('user_id', requestingUserId);
      }
      const { data, error } = await query.select();
      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase deleteWorkspace error:', error.message);
          throw new Error(`Database error deleting workspace: ${error.message}`);
        }
      } else {
        return Boolean(data && data.length > 0);
      }
    }

    const existing = memoryWorkspaces.get(id);
    if (!existing) return false;
    if (requestingUserId && existing.userId !== requestingUserId && existing.userId !== DEFAULT_USER_ID) {
      return false;
    }

    const deleted = memoryWorkspaces.delete(id);
    if (deleted) saveLocalDb();
    return deleted;
  },

  // ---------------------------------------------------------------------------
  // DOCUMENTS
  // ---------------------------------------------------------------------------
  async listDocuments(workspaceId: string): Promise<DocumentRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase listDocuments error:', error.message);
          throw new Error(`Database error listing documents: ${error.message}`);
        }
      } else {
        return (data || []).map((d: any) => ({
          id: d.id,
          workspaceId: d.workspace_id,
          title: d.title,
          fileName: d.file_name,
          fileSize: d.file_size,
          fileType: d.file_type,
          author: d.author,
          summary: d.summary,
          pages: d.pages,
          status: d.status,
          tags: d.tags || [],
          extractedClaimsCount: d.extracted_claims_count || 0,
          contradictionsCount: d.contradictions_count || 0,
          pipelineSteps: d.pipeline_steps || { ocr: 'done', entityExtraction: 'done', claimTriangulation: 'done', conflictCheck: 'done' },
          storagePath: d.storage_path,
          storageProvider: d.storage_provider,
          createdAt: d.created_at,
        }));
      }
    }

    return Array.from(memoryDocuments.values()).filter(d => d.workspaceId === workspaceId);
  },

  async createDocument(doc: Omit<DocumentRecord, 'id' | 'createdAt'>): Promise<DocumentRecord> {
    const id = `doc-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newRecord: DocumentRecord = {
      ...doc,
      id,
      createdAt,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          id,
          workspace_id: doc.workspaceId,
          title: doc.title,
          file_name: doc.fileName,
          file_size: doc.fileSize,
          file_type: doc.fileType,
          author: doc.author,
          summary: doc.summary,
          pages: doc.pages,
          status: doc.status,
          tags: doc.tags,
          extracted_claims_count: doc.extractedClaimsCount,
          contradictions_count: doc.contradictionsCount,
          pipeline_steps: doc.pipelineSteps,
          storage_path: doc.storagePath,
          storage_provider: doc.storageProvider || 'local',
        })
        .select()
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase createDocument error:', error.message);
          throw new Error(`Database error saving document: ${error.message}`);
        }
      } else {
        const ws = await this.getWorkspaceById(doc.workspaceId);
        if (ws) {
          await this.updateWorkspace(doc.workspaceId, {
            documentsCount: ws.documentsCount + 1,
            claimsCount: ws.claimsCount + doc.extractedClaimsCount,
            contradictionsCount: ws.contradictionsCount + doc.contradictionsCount,
          });
        }

        return {
          id: data.id,
          workspaceId: data.workspace_id,
          title: data.title,
          fileName: data.file_name,
          fileSize: data.file_size,
          fileType: data.file_type,
          author: data.author,
          summary: data.summary,
          pages: data.pages,
          status: data.status,
          tags: data.tags || [],
          extractedClaimsCount: data.extracted_claims_count || 0,
          contradictionsCount: data.contradictions_count || 0,
          pipelineSteps: data.pipeline_steps,
          storagePath: data.storage_path,
          storageProvider: data.storage_provider,
          createdAt: data.created_at,
        };
      }
    }

    memoryDocuments.set(id, newRecord);

    const ws = memoryWorkspaces.get(doc.workspaceId);
    if (ws) {
      ws.documentsCount += 1;
      ws.claimsCount += doc.extractedClaimsCount;
      ws.contradictionsCount += doc.contradictionsCount;
    }

    saveLocalDb();
    return newRecord;
  },

  async deleteDocument(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase deleteDocument error:', error.message);
          throw new Error(`Database error removing document: ${error.message}`);
        }
      } else {
        return true;
      }
    }

    const deleted = memoryDocuments.delete(id);
    if (deleted) saveLocalDb();
    return deleted;
  },

  // ---------------------------------------------------------------------------
  // CLAIMS (Evidence Passages)
  // ---------------------------------------------------------------------------
  async listClaims(workspaceId: string): Promise<ClaimRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase listClaims error:', error.message);
          throw new Error(`Database error listing claims: ${error.message}`);
        }
      } else {
        return (data || []).map((c: any) => ({
          id: c.id,
          documentId: c.document_id,
          workspaceId: c.workspace_id,
          statement: c.statement,
          confidence: c.confidence,
          evidenceType: c.evidence_type,
          status: c.status,
          quote: c.quote,
          extractedDate: c.extracted_date,
          relatedOptionId: c.related_option_id,
          tags: c.tags || [],
          createdAt: c.created_at,
        }));
      }
    }

    return Array.from(memoryClaims.values()).filter(c => c.workspaceId === workspaceId);
  },

  async createClaim(claim: Omit<ClaimRecord, 'id'>): Promise<ClaimRecord> {
    const id = `cl-${Date.now()}`;
    const newRecord: ClaimRecord = { ...claim, id };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('claims')
        .insert({
          id,
          document_id: claim.documentId,
          workspace_id: claim.workspaceId,
          statement: claim.statement,
          confidence: claim.confidence,
          evidence_type: claim.evidenceType,
          status: claim.status,
          quote: claim.quote,
          extracted_date: claim.extractedDate,
          related_option_id: claim.relatedOptionId,
          tags: claim.tags,
        })
        .select()
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase createClaim error:', error.message);
          throw new Error(`Database error creating claim: ${error.message}`);
        }
      } else {
        return {
          id: data.id,
          documentId: data.document_id,
          workspaceId: data.workspace_id,
          statement: data.statement,
          confidence: data.confidence,
          evidenceType: data.evidence_type,
          status: data.status,
          quote: data.quote,
          extractedDate: data.extracted_date,
          relatedOptionId: data.related_option_id,
          tags: data.tags || [],
          createdAt: data.created_at,
        };
      }
    }

    memoryClaims.set(id, newRecord);
    saveLocalDb();
    return newRecord;
  },

  // ---------------------------------------------------------------------------
  // DECISION SCENARIOS
  // ---------------------------------------------------------------------------
  async listScenarios(workspaceId: string, userId?: string): Promise<ScenarioRecord[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('decision_scenarios').select('*').eq('workspace_id', workspaceId);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase listScenarios error:', error.message);
          throw new Error(`Database error listing scenarios: ${error.message}`);
        }
      } else {
        return (data || []).map((s: any) => ({
          id: s.id,
          workspaceId: s.workspace_id,
          userId: s.user_id,
          name: s.name,
          description: s.description,
          constraints: {
            budgetLimit: Number(s.budget_limit),
            maxLatencyMs: Number(s.max_latency_ms),
            maxSpaceUnits: s.max_space_units,
            requiredCompliance: s.required_compliance,
            maxImplementationMonths: s.max_implementation_months,
            priorityWeights: s.priority_weights,
          },
          simulationResults: s.simulation_results,
          createdAt: s.created_at,
        }));
      }
    }

    return Array.from(memoryScenarios.values()).filter(
      s => s.workspaceId === workspaceId && (!userId || s.userId === userId)
    );
  },

  async createScenario(scenario: Omit<ScenarioRecord, 'id' | 'createdAt'>): Promise<ScenarioRecord> {
    const id = `scn-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newRecord: ScenarioRecord = {
      ...scenario,
      id,
      createdAt,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('decision_scenarios')
        .insert({
          id,
          workspace_id: scenario.workspaceId,
          user_id: scenario.userId,
          name: scenario.name,
          description: scenario.description,
          budget_limit: scenario.constraints.budgetLimit,
          max_latency_ms: scenario.constraints.maxLatencyMs,
          max_space_units: scenario.constraints.maxSpaceUnits,
          required_compliance: scenario.constraints.requiredCompliance,
          max_implementation_months: scenario.constraints.maxImplementationMonths,
          priority_weights: scenario.constraints.priorityWeights,
          simulation_results: scenario.simulationResults,
        })
        .select()
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase createScenario error:', error.message);
          throw new Error(`Database error saving scenario: ${error.message}`);
        }
      } else {
        return {
          id: data.id,
          workspaceId: data.workspace_id,
          userId: data.user_id,
          name: data.name,
          description: data.description,
          constraints: {
            budgetLimit: Number(data.budget_limit),
            maxLatencyMs: Number(data.max_latency_ms),
            maxSpaceUnits: data.max_space_units,
            requiredCompliance: data.required_compliance,
            maxImplementationMonths: data.max_implementation_months,
            priorityWeights: data.priority_weights,
          },
          simulationResults: data.simulation_results,
          createdAt: data.created_at,
        };
      }
    }

    memoryScenarios.set(id, newRecord);
    saveLocalDb();
    return newRecord;
  },

  // ---------------------------------------------------------------------------
  // CANDIDATE OPTIONS (Multi-domain: Solar Energy & Cloud Infrastructure)
  // ---------------------------------------------------------------------------
  async listOptions(workspaceId: string): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('decision_options')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase listOptions error:', error.message);
          throw new Error(`Database error listing options: ${error.message}`);
        }
      } else if (data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          workspaceId: d.workspace_id,
          name: d.name,
          tagline: d.tagline,
          badge: d.badge,
          description: d.description,
          domainCategory: d.domain_category,
          currency: d.currency,
          costFormatted: d.cost_formatted,
          estimatedCost: d.estimated_cost !== null ? Number(d.estimated_cost) : null,
          roofSpaceRequired: d.roof_space_required,
          dailyEnergyOutput: d.daily_energy_output !== null ? Number(d.daily_energy_output) : null,
          baseMonthlyCost: Number(d.base_monthly_cost || 0),
          baseLatencyMs: Number(d.base_latency_ms || 0),
          spaceRequiredUnits: d.space_required_units || 0,
          supportedCompliance: d.supported_compliance || ['standard'],
          implementationMonths: d.implementation_months || 6,
          complexityLevel: d.complexity_level || 'medium',
          pros: d.pros || [],
          cons: d.cons || [],
          confidenceScore: d.confidence_score || 85,
          criteriaRatings: d.criteria_ratings || {},
          metricCitations: d.metric_citations || {},
          hasInsufficientEvidence: d.has_insufficient_evidence || false,
          missingCriteria: d.missing_criteria || [],
          completenessSummary: d.completeness_summary || {},
        }));
      }
    }

    return memoryOptions.get(workspaceId) || [];
  },

  async setOptions(workspaceId: string, options: any[]): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('decision_options').delete().eq('workspace_id', workspaceId);

      const rows = options.map(opt => ({
        id: opt.id || `opt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        workspace_id: workspaceId,
        name: opt.name,
        tagline: opt.tagline,
        badge: opt.badge,
        description: opt.description,
        domain_category: opt.domainCategory || 'general',
        currency: opt.currency || 'USD',
        cost_formatted: opt.costFormatted,
        estimated_cost: opt.estimatedCost,
        roof_space_required: opt.roofSpaceRequired,
        daily_energy_output: opt.dailyEnergyOutput,
        base_monthly_cost: opt.baseMonthlyCost || 0,
        base_latency_ms: opt.baseLatencyMs || 0,
        space_required_units: opt.spaceRequiredUnits || 0,
        supported_compliance: opt.supportedCompliance || ['standard'],
        implementation_months: opt.implementationMonths || 6,
        complexity_level: opt.complexityLevel || 'medium',
        pros: opt.pros || [],
        cons: opt.cons || [],
        confidence_score: opt.confidenceScore || 85,
        criteria_ratings: opt.criteriaRatings || {},
        metric_citations: opt.metricCitations || {},
        has_insufficient_evidence: Boolean(opt.hasInsufficientEvidence),
        missing_criteria: opt.missingCriteria || [],
        completeness_summary: opt.completenessSummary || {},
      }));

      const { data, error } = await supabase.from('decision_options').insert(rows).select();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase setOptions error:', error.message);
          throw new Error(`Database error saving decision options: ${error.message}`);
        }
      } else {
        return data;
      }
    }

    memoryOptions.set(workspaceId, options);
    saveLocalDb();
    return options;
  },

  // ---------------------------------------------------------------------------
  // EVIDENCE RELATIONSHIPS
  // ---------------------------------------------------------------------------
  async listEvidenceRelationships(workspaceId: string): Promise<EvidenceRelationshipRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('evidence_relationships')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase listEvidenceRelationships error:', error.message);
          throw new Error(`Database error listing relationships: ${error.message}`);
        }
      } else {
        return (data || []).map((r: any) => ({
          id: r.id,
          workspaceId: r.workspace_id,
          sourceClaimId: r.source_claim_id,
          targetClaimId: r.target_claim_id,
          relationshipType: r.relationship_type,
          severity: r.severity,
          impactNotes: r.impact_notes,
          resolutionStatus: r.resolution_status,
          createdAt: r.created_at,
        }));
      }
    }

    return Array.from(memoryRelationships.values()).filter(r => r.workspaceId === workspaceId);
  },

  async createEvidenceRelationship(rel: Omit<EvidenceRelationshipRecord, 'id' | 'createdAt'>): Promise<EvidenceRelationshipRecord> {
    const id = `rel-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newRecord: EvidenceRelationshipRecord = { ...rel, id, createdAt };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('evidence_relationships')
        .insert({
          id,
          workspace_id: rel.workspaceId,
          source_claim_id: rel.sourceClaimId,
          target_claim_id: rel.targetClaimId,
          relationship_type: rel.relationshipType,
          severity: rel.severity,
          impact_notes: rel.impactNotes,
          resolutionStatus: rel.resolutionStatus,
        })
        .select()
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          // Fall through
        } else {
          console.error('Supabase createEvidenceRelationship error:', error.message);
          throw new Error(`Database error creating relationship: ${error.message}`);
        }
      } else {
        return {
          id: data.id,
          workspaceId: data.workspace_id,
          sourceClaimId: data.source_claim_id,
          targetClaimId: data.target_claim_id,
          relationshipType: data.relationship_type,
          severity: data.severity,
          impactNotes: data.impact_notes,
          resolutionStatus: data.resolution_status,
          createdAt: data.created_at,
        };
      }
    }

    memoryRelationships.set(id, newRecord);
    saveLocalDb();
    return newRecord;
  },
};
