import { supabase } from '../config/supabase.js';

async function seedSupabase() {
  console.log('Seeding Supabase PostgreSQL with initial demonstration data...');

  if (!supabase) {
    console.error('Supabase client is not available.');
    process.exit(1);
  }

  // 1. Seed Demo User
  const demoUserId = 'usr-demo-rostova';
  const { data: user, error: userErr } = await supabase
    .from('users')
    .upsert({
      id: demoUserId,
      email: 'architect@veritygraph.ai',
      password_hash: '$2b$10$vlSXHURM4PnJs.d.iHKMBO5JR6ossVb4WBraLVF7AaKqw.7NLAxF2',
      full_name: 'Dr. Elena Rostova',
      role: 'lead_architect',
    })
    .select()
    .single();

  if (userErr) {
    console.error('Error seeding user:', userErr.message);
  } else {
    console.log('✓ Seeded user:', user.email);
  }

  // 2. Seed Workspaces
  const workspaces = [
    {
      id: 'ws-cloud-arch',
      user_id: demoUserId,
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
    {
      id: 'ws-solar-campus',
      user_id: demoUserId,
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
  ];

  for (const ws of workspaces) {
    const { error: wsErr } = await supabase.from('research_workspaces').upsert(ws);
    if (wsErr) console.error(`Error seeding workspace ${ws.id}:`, wsErr.message);
    else console.log(`✓ Seeded workspace: ${ws.name}`);
  }

  // 3. Seed Document
  const docSolar = {
    id: 'doc-solar-campus',
    workspace_id: 'ws-solar-campus',
    title: 'Campus Solar Energy Planning and Microgrid Feasibility Study 2026',
    file_name: 'Campus_Solar_Energy_Planning.pdf',
    file_size: '3.4 MB',
    file_type: 'pdf',
    author: 'Campus Energy & Sustainability Office',
    summary: 'Comprehensive engineering feasibility assessment evaluating Solar A (Monocrystalline rooftop), Solar B (Bifacial canopy), and Solar C (Thin-film flexible).',
    pages: 38,
    status: 'completed',
    tags: ['Solar Energy', 'Campus Planning', 'Microgrid', 'CapEx'],
    extracted_claims_count: 12,
    contradictions_count: 1,
    pipeline_steps: { ocr: 'done', entityExtraction: 'done', claimTriangulation: 'done', conflictCheck: 'done' },
    storage_path: 'ws-solar-campus/1791884885685_Campus_Solar_Energy_Planning.pdf',
    storage_provider: 'supabase',
  };

  const { error: docErr } = await supabase.from('documents').upsert(docSolar);
  if (docErr) console.error('Error seeding document:', docErr.message);
  else console.log('✓ Seeded document:', docSolar.title);

  // 4. Seed Claims
  const claims = [
    {
      id: 'cl-solar-1',
      document_id: 'doc-solar-campus',
      workspace_id: 'ws-solar-campus',
      statement: 'Finding 1: Solar A has the lowest reported cost in this hypothetical comparison, but its daily energy estimate is lower than Solar B\'s.',
      confidence: 94,
      evidence_type: 'empirical',
      status: 'verified',
      quote: 'Finding 1: Solar A has the lowest reported cost in this hypothetical comparison, but its daily energy estimate is lower than Solar B\'s.',
      extracted_date: '2026-10-10',
      related_option_id: 'opt-solar-a',
      tags: ['Solar A', 'Cost Comparison', 'Daily Energy'],
    },
    {
      id: 'cl-solar-2',
      document_id: 'doc-solar-campus',
      workspace_id: 'ws-solar-campus',
      statement: 'Finding 2: Solar B has the highest stated daily energy estimate, but its illustrative cost exceeds a budget of ₹5 lakh.',
      confidence: 92,
      evidence_type: 'empirical',
      status: 'verified',
      quote: 'Finding 2: Solar B has the highest stated daily energy estimate, but its illustrative cost exceeds a budget of n5 lakh.',
      extracted_date: '2026-10-10',
      related_option_id: 'opt-solar-b',
      tags: ['Solar B', 'Budget Exceedance', 'Daily Energy'],
    },
    {
      id: 'cl-solar-3',
      document_id: 'doc-solar-campus',
      workspace_id: 'ws-solar-campus',
      statement: 'Finding 3: Solar C cannot be ranked reliably on cost because its cost is not reported. A decision-maker should obtain a cost estimate before comparing total value.',
      confidence: 88,
      evidence_type: 'third_party_benchmark',
      status: 'conflicted',
      quote: 'Finding 3: Solar C cannot be ranked reliably on cost because its cost is not reported. A decision-maker should obtain a cost estimate before comparing total value.',
      extracted_date: '2026-10-10',
      related_option_id: 'opt-solar-c',
      tags: ['Solar C', 'Incomplete Evidence', 'Cost Not Reported'],
    },
  ];

  for (const cl of claims) {
    const { error: clErr } = await supabase.from('claims').upsert(cl);
    if (clErr) console.error(`Error seeding claim ${cl.id}:`, clErr.message);
    else console.log(`✓ Seeded claim: ${cl.id}`);
  }

  // 5. Seed Solar Decision Options
  const solarOptions = [
    {
      id: 'opt-solar-a',
      workspace_id: 'ws-solar-campus',
      name: 'Solar A',
      tagline: 'Lowest reported cost rooftop solar option from comparative audit.',
      badge: 'Lowest Reported Cost',
      description: 'Rooftop solar option documented in Campus Solar Energy Planning. Requires 800 sq. ft. of roof area at estimated cost of ₹4 lakh with 80 kWh/day generation.',
      domain_category: 'solar_energy',
      currency: 'INR',
      cost_formatted: '₹4 lakh',
      estimated_cost: 400000,
      roof_space_required: 800,
      daily_energy_output: 80,
      base_monthly_cost: 400000,
      base_latency_ms: 0,
      space_required_units: 800,
      supported_compliance: ['standard'],
      implementation_months: 6,
      complexity_level: 'medium',
      pros: ['Lowest reported cost in hypothetical comparison (₹4 lakh)', 'Modest 800 sq. ft. roof area requirement'],
      cons: ['Daily energy estimate (80 kWh/day) is lower than Solar B (110 kWh/day)'],
      confidence_score: 92,
      metric_citations: {
        cost: { value: 400000, unit: '₹', label: 'Estimated Cost', quote: 'Solar A n4 lakh 800 sq. ft. 80 kWh/day' },
        space: { value: 800, unit: 'sq. ft.', label: 'Roof Area', quote: 'Solar A n4 lakh 800 sq. ft. 80 kWh/day' },
        energyOutput: { value: 80, unit: 'kWh/day', label: 'Daily Energy', quote: 'Solar A n4 lakh 800 sq. ft. 80 kWh/day' },
      },
      has_insufficient_evidence: false,
      missing_criteria: [],
    },
    {
      id: 'opt-solar-b',
      workspace_id: 'ws-solar-campus',
      name: 'Solar B',
      tagline: 'Highest stated daily energy generation system.',
      badge: 'Highest Daily Energy',
      description: 'Solar option documented in Campus Solar Energy Planning with highest energy output (110 kWh/day) and compact 600 sq. ft. roof footprint at ₹6 lakh.',
      domain_category: 'solar_energy',
      currency: 'INR',
      cost_formatted: '₹6 lakh',
      estimated_cost: 600000,
      roof_space_required: 600,
      daily_energy_output: 110,
      base_monthly_cost: 600000,
      base_latency_ms: 0,
      space_required_units: 600,
      supported_compliance: ['standard'],
      implementation_months: 6,
      complexity_level: 'medium',
      pros: ['Highest stated daily energy estimate (110 kWh/day)', 'Most compact spatial footprint of surveyed candidates (600 sq. ft.)'],
      cons: ['Illustrative cost (₹6 lakh) exceeds baseline budget limit of ₹5 lakh'],
      confidence_score: 90,
      metric_citations: {
        cost: { value: 600000, unit: '₹', label: 'Estimated Cost', quote: 'Solar B n6 lakh 600 sq. ft. 110 kWh/day' },
        space: { value: 600, unit: 'sq. ft.', label: 'Roof Area', quote: 'Solar B n6 lakh 600 sq. ft. 110 kWh/day' },
        energyOutput: { value: 110, unit: 'kWh/day', label: 'Daily Energy', quote: 'Solar B n6 lakh 600 sq. ft. 110 kWh/day' },
      },
      has_insufficient_evidence: false,
      missing_criteria: [],
    },
    {
      id: 'opt-solar-c',
      workspace_id: 'ws-solar-campus',
      name: 'Solar C',
      tagline: 'Incomplete cost reporting; requires cost estimate before comparing total value.',
      badge: 'Insufficient Evidence (Cost Missing)',
      description: 'Rooftop option from Campus Solar Energy Planning requiring 900 sq. ft. and generating 95 kWh/day. Cost is NOT reported in document.',
      domain_category: 'solar_energy',
      currency: 'INR',
      cost_formatted: 'Not reported',
      estimated_cost: null, // Preserved as NULL!
      roof_space_required: 900,
      daily_energy_output: 95,
      base_monthly_cost: 0,
      base_latency_ms: 0,
      space_required_units: 900,
      supported_compliance: ['standard'],
      implementation_months: 6,
      complexity_level: 'medium',
      pros: ['Higher daily energy estimate (95 kWh/day) than Solar A (80 kWh/day)'],
      cons: ['INSUFFICIENT EVIDENCE: Cost is not reported in document', 'Cannot be ranked reliably on cost'],
      confidence_score: 50,
      metric_citations: {
        cost: { value: null, unit: '₹', label: 'Estimated Cost', quote: 'Solar C Not reported 900 sq. ft. 95 kWh/day' },
        space: { value: 900, unit: 'sq. ft.', label: 'Roof Area', quote: 'Solar C Not reported 900 sq. ft. 95 kWh/day' },
        energyOutput: { value: 95, unit: 'kWh/day', label: 'Daily Energy', quote: 'Solar C Not reported 900 sq. ft. 95 kWh/day' },
      },
      has_insufficient_evidence: true,
      missing_criteria: ['Estimated Cost (Not reported)'],
    },
  ];

  for (const opt of solarOptions) {
    const { error: optErr } = await supabase.from('decision_options').upsert(opt);
    if (optErr) console.error(`Error seeding option ${opt.id}:`, optErr.message);
    else console.log(`✓ Seeded decision option: ${opt.name}`);
  }

  console.log('\n🎉 Supabase PostgreSQL successfully populated with live seed data!');
}

seedSupabase().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
