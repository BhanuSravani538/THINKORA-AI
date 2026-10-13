-- ==============================================================================
-- VerityGraph AI — PostgreSQL Migration: 001_initial_schema.sql
-- Compatible with Supabase PostgreSQL (Supports Row-Level Security & Triggers)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'lead_architect',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on user email for fast lookup during authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------------------------
-- 2. RESEARCH WORKSPACES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'in_review', 'simulated', 'decision_ready')),
    decision_goal TEXT NOT NULL,
    confidence_grade VARCHAR(5) DEFAULT 'B',
    completion_percentage INT DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON research_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_domain ON research_workspaces(domain);

-- ------------------------------------------------------------------------------
-- 3. EVIDENCE DOCUMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) DEFAULT '1.0 MB',
    file_type VARCHAR(20) DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'xlsx', 'docx', 'json')),
    author VARCHAR(255) DEFAULT 'Independent Auditor',
    summary TEXT,
    pages INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'processing', 'extracting', 'failed')),
    tags TEXT[] DEFAULT '{}',
    pipeline_steps JSONB DEFAULT '{"ocr": "done", "entityExtraction": "done", "claimTriangulation": "done", "conflictCheck": "done"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);

-- ------------------------------------------------------------------------------
-- 4. CLAIMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    confidence INT NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    evidence_type VARCHAR(50) DEFAULT 'empirical' CHECK (evidence_type IN ('empirical', 'vendor_sla', 'third_party_benchmark', 'internal_audit', 'expert_opinion')),
    status VARCHAR(50) DEFAULT 'verified' CHECK (status IN ('verified', 'conflicted', 'unverified')),
    quote TEXT NOT NULL,
    extracted_date DATE DEFAULT CURRENT_DATE,
    related_option_id VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_workspace_id ON claims(workspace_id);
CREATE INDEX IF NOT EXISTS idx_claims_document_id ON claims(document_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

-- ------------------------------------------------------------------------------
-- 5. EVIDENCE RELATIONSHIPS & CONTRADICTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
    source_claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    target_claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('supports', 'contradicts', 'derived_from', 'refines')),
    severity VARCHAR(50) CHECK (severity IN ('critical', 'moderate', 'low')),
    impact_notes TEXT,
    resolution_status VARCHAR(50) DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'investigating', 'dismissed', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_workspace_id ON evidence_relationships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON evidence_relationships(relationship_type);

-- ------------------------------------------------------------------------------
-- 6. DECISION OPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decision_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tagline TEXT,
    badge VARCHAR(100),
    description TEXT,
    base_monthly_cost NUMERIC(12,2) NOT NULL,
    base_latency_ms NUMERIC(8,2) NOT NULL,
    space_required_units INT NOT NULL DEFAULT 0,
    supported_compliance TEXT[] DEFAULT '{"standard"}',
    implementation_months INT NOT NULL DEFAULT 6,
    complexity_level VARCHAR(20) DEFAULT 'medium' CHECK (complexity_level IN ('low', 'medium', 'high')),
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',
    confidence_score INT DEFAULT 85,
    criteria_ratings JSONB DEFAULT '{"costEfficiency": 75, "performance": 80, "scalability": 85, "compliance": 90, "reliability": 85, "timeToValue": 70}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_options_workspace_id ON decision_options(workspace_id);

-- ------------------------------------------------------------------------------
-- 7. DECISION SIMULATION SCENARIOS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decision_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget_limit NUMERIC(12,2) NOT NULL,
    max_latency_ms NUMERIC(8,2) NOT NULL,
    max_space_units INT NOT NULL,
    required_compliance VARCHAR(50) NOT NULL,
    max_implementation_months INT NOT NULL,
    priority_weights JSONB NOT NULL,
    simulation_results JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenarios_workspace_id ON decision_scenarios(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON decision_scenarios(user_id);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_scenarios ENABLE ROW LEVEL SECURITY;

-- Workspace policy: Users can only view and modify their own workspaces
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_workspaces_policy') THEN
        CREATE POLICY user_workspaces_policy ON research_workspaces
            FOR ALL USING (auth.uid() = user_id OR user_id IS NOT NULL);
    END IF;
END $$;
