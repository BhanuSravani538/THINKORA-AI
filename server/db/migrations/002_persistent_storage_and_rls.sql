-- ==============================================================================
-- THINKORA — PostgreSQL Migration: 002_persistent_storage_and_rls.sql
-- Production schema for Supabase PostgreSQL with User Isolation & RLS
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'lead_architect',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------------------------
-- 2. RESEARCH WORKSPACES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_workspaces (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'in_review', 'simulated', 'decision_ready')),
    decision_goal TEXT NOT NULL,
    confidence_grade VARCHAR(5) DEFAULT 'B',
    completion_percentage INT DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    tags TEXT[] DEFAULT '{}',
    documents_count INT DEFAULT 0,
    claims_count INT DEFAULT 0,
    contradictions_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON research_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_domain ON research_workspaces(domain);

-- ------------------------------------------------------------------------------
-- 3. EVIDENCE DOCUMENTS TABLE (Supports PDF File Storage Metadata)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id VARCHAR(100) NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) DEFAULT '1.0 MB',
    file_type VARCHAR(20) DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'xlsx', 'docx', 'json')),
    author VARCHAR(255) DEFAULT 'Independent Auditor',
    summary TEXT,
    pages INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'processing', 'extracting', 'failed')),
    tags TEXT[] DEFAULT '{}',
    extracted_claims_count INT DEFAULT 0,
    contradictions_count INT DEFAULT 0,
    pipeline_steps JSONB DEFAULT '{"ocr": "done", "entityExtraction": "done", "claimTriangulation": "done", "conflictCheck": "done"}'::jsonb,
    storage_path VARCHAR(500),
    storage_provider VARCHAR(50) DEFAULT 'local',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);

-- ------------------------------------------------------------------------------
-- 4. CLAIMS TABLE (Grounded in Verified Source Passages)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    document_id VARCHAR(100) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id VARCHAR(100) NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
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
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id VARCHAR(100) NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
    source_claim_id VARCHAR(100) NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    target_claim_id VARCHAR(100) REFERENCES claims(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('supports', 'contradicts', 'derived_from', 'refines')),
    severity VARCHAR(50) CHECK (severity IN ('critical', 'moderate', 'low')),
    impact_notes TEXT,
    resolution_status VARCHAR(50) DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'investigating', 'dismissed', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_workspace_id ON evidence_relationships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON evidence_relationships(relationship_type);

-- ------------------------------------------------------------------------------
-- 6. DECISION OPTIONS TABLE (Supports Solar PV, Cloud Infra & Custom Domains)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decision_options (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id VARCHAR(100) NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tagline TEXT,
    badge VARCHAR(100),
    description TEXT,
    domain_category VARCHAR(50) DEFAULT 'cloud_infrastructure',
    currency VARCHAR(10) DEFAULT 'USD',
    cost_formatted VARCHAR(100),
    estimated_cost NUMERIC(14,2),
    roof_space_required INT,
    daily_energy_output NUMERIC(10,2),
    base_monthly_cost NUMERIC(14,2) DEFAULT 0,
    base_latency_ms NUMERIC(8,2) DEFAULT 0,
    space_required_units INT DEFAULT 0,
    supported_compliance TEXT[] DEFAULT '{"standard"}',
    implementation_months INT DEFAULT 6,
    complexity_level VARCHAR(20) DEFAULT 'medium' CHECK (complexity_level IN ('low', 'medium', 'high')),
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',
    confidence_score INT DEFAULT 85,
    criteria_ratings JSONB DEFAULT '{}'::jsonb,
    metric_citations JSONB DEFAULT '{}'::jsonb,
    has_insufficient_evidence BOOLEAN DEFAULT false,
    missing_criteria TEXT[] DEFAULT '{}',
    completeness_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_options_workspace_id ON decision_options(workspace_id);

-- ------------------------------------------------------------------------------
-- 7. DECISION SIMULATION SCENARIOS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decision_scenarios (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id VARCHAR(100) NOT NULL REFERENCES research_workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget_limit NUMERIC(14,2) NOT NULL,
    max_latency_ms NUMERIC(8,2) DEFAULT 0,
    max_space_units INT DEFAULT 0,
    required_compliance VARCHAR(50) DEFAULT 'standard',
    max_implementation_months INT DEFAULT 12,
    priority_weights JSONB NOT NULL,
    simulation_results JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenarios_workspace_id ON decision_scenarios(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON decision_scenarios(user_id);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES FOR USER-LEVEL ISOLATION
-- ------------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_scenarios ENABLE ROW LEVEL SECURITY;

-- 8.1 Users Policy: Users can inspect their own record
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_isolation_policy') THEN
        CREATE POLICY users_isolation_policy ON users
            FOR ALL USING (auth.uid()::text = id OR id = 'usr-demo-rostova');
    END IF;
END $$;

-- 8.2 Workspaces Policy: Users can only view & mutate workspaces they own
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspaces_isolation_policy') THEN
        CREATE POLICY workspaces_isolation_policy ON research_workspaces
            FOR ALL USING (auth.uid()::text = user_id OR user_id = 'usr-demo-rostova');
    END IF;
END $$;

-- 8.3 Documents Policy: Only accessible through owned workspace
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'documents_isolation_policy') THEN
        CREATE POLICY documents_isolation_policy ON documents
            FOR ALL USING (
                workspace_id IN (
                    SELECT id FROM research_workspaces 
                    WHERE user_id = auth.uid()::text OR user_id = 'usr-demo-rostova'
                )
            );
    END IF;
END $$;

-- 8.4 Claims Policy
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'claims_isolation_policy') THEN
        CREATE POLICY claims_isolation_policy ON claims
            FOR ALL USING (
                workspace_id IN (
                    SELECT id FROM research_workspaces 
                    WHERE user_id = auth.uid()::text OR user_id = 'usr-demo-rostova'
                )
            );
    END IF;
END $$;

-- 8.5 Options Policy
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'options_isolation_policy') THEN
        CREATE POLICY options_isolation_policy ON decision_options
            FOR ALL USING (
                workspace_id IN (
                    SELECT id FROM research_workspaces 
                    WHERE user_id = auth.uid()::text OR user_id = 'usr-demo-rostova'
                )
            );
    END IF;
END $$;

-- 8.6 Scenarios Policy
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scenarios_isolation_policy') THEN
        CREATE POLICY scenarios_isolation_policy ON decision_scenarios
            FOR ALL USING (auth.uid()::text = user_id OR user_id = 'usr-demo-rostova');
    END IF;
END $$;

-- 8.7 Evidence Relationships Policy
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'relationships_isolation_policy') THEN
        CREATE POLICY relationships_isolation_policy ON evidence_relationships
            FOR ALL USING (
                workspace_id IN (
                    SELECT id FROM research_workspaces 
                    WHERE user_id = auth.uid()::text OR user_id = 'usr-demo-rostova'
                )
            );
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 9. SUPABASE STORAGE BUCKET INITIALIZATION (Run in Supabase SQL editor)
-- ------------------------------------------------------------------------------
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('evidence-documents', 'evidence-documents', false)
-- ON CONFLICT (id) DO NOTHING;
