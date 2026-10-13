-- ==============================================================================
-- VerityGraph AI — Seed Data Migration: seed.sql
-- ==============================================================================

-- 1. Insert default demonstration user (Password: Password123!)
-- Hash generated via bcrypt: $2a$10$wT2Hl4Fq9W83X0Z8wJ6hG.r9k0zU6j8c6K5T6S4v6r9k0zU6j8c6K
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'architect@veritygraph.ai',
    '$2a$10$X879k2LqfJp1u1yqM1YkSehP1c5eZ2J3K4L5M6N7O8P9Q0R1S2T3U',
    'Dr. Elena Rostova',
    'VP Architecture & Intelligence'
) ON CONFLICT (email) DO NOTHING;

-- 2. Insert primary workspace
INSERT INTO research_workspaces (
    id,
    user_id,
    name,
    description,
    domain,
    status,
    decision_goal,
    confidence_grade,
    completion_percentage,
    tags
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Enterprise Cloud Migration & AI Inference Infrastructure',
    'Evidence-based architectural evaluation comparing multi-region serverless, hybrid Kubernetes bare-metal, and sovereign colocation for 85M daily transactional events.',
    'Enterprise Infrastructure',
    'simulated',
    'Select runtime platform balancing <25ms p99 SLA against $140k/mo budget cap and strict SOC2/HIPAA compliance.',
    'A',
    88,
    ARRAY['Cloud', 'Kubernetes', 'Serverless', 'FinOps', 'Latency-Critical']
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert documents
INSERT INTO documents (
    id,
    workspace_id,
    title,
    file_name,
    file_size,
    file_type,
    author,
    summary,
    pages,
    status,
    tags
) VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Gartner Enterprise Cloud TCO & Performance Benchmark 2025',
    'Gartner_Cloud_Migration_TCO_Benchmark_2025.pdf',
    '4.8 MB',
    'pdf',
    'Gartner Research Group',
    'Comprehensive analysis of 120 enterprise migrations comparing cloud-native managed services against hybrid deployments.',
    42,
    'completed',
    ARRAY['Gartner', 'FinOps', 'Egress']
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert claims
INSERT INTO claims (
    id,
    document_id,
    workspace_id,
    statement,
    confidence,
    evidence_type,
    status,
    quote,
    tags
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Managed Serverless architectures incur 3.8x higher egress networking costs once sustained IOPS exceed 45,000 req/sec.',
    94,
    'third_party_benchmark',
    'verified',
    'At scale (>40k sustained QPS), AWS Lambda and API Gateway data egress charges erode operational margin compared to containerized pods by up to 280%.',
    ARRAY['Cost', 'FinOps', 'Egress']
) ON CONFLICT (id) DO NOTHING;
