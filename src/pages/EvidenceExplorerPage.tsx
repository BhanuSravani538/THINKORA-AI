import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  TableProperties,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  DollarSign,
  Zap,
  HardDrive,
  Shield,
  Sliders,
  X,
  Layers,
  Lightbulb,
  Compass,
  FileText,
  ArrowRight,
  Sun,
} from 'lucide-react';
import { formatCurrency, formatLatency } from '../utils/decisionEngine';
import { getOptionCompleteness } from '../utils/evidenceCompleteness';
import type { ContradictionItem, SupportingEvidence, OptionCriterionCompleteness } from '../types';
import { useNavigate } from 'react-router-dom';

export const EvidenceExplorerPage: React.FC = () => {
  const { options, activeWorkspace, simulationResults } = useWorkspace();
  const [filterMode, setFilterMode] = useState<'all' | 'completeness' | 'contradictions' | 'gaps' | 'evidence'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContradiction, setSelectedContradiction] = useState<ContradictionItem | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<SupportingEvidence | null>(null);
  const [selectedCompletenessCriterion, setSelectedCompletenessCriterion] = useState<{ criterion: OptionCriterionCompleteness; optionName: string } | null>(null);
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {activeWorkspace.domain}
            </span>
            <span className="text-xs text-slate-400">Workspace Matrix</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <TableProperties className="w-6 h-6 text-blue-400" /> Evidence Matrix & Contradiction Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Cross-evaluate candidate architectures, empirical proofs, flagged contradictions, and unresolved knowledge gaps.
          </p>
        </div>

        <button
          onClick={() => navigate('/simulator')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <Sliders className="w-4 h-4" />
          <span>Launch Simulator</span>
        </button>
      </div>

      {/* Filter and Highlights Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Matrix Dimensions
          </button>
          <button
            onClick={() => setFilterMode('completeness')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterMode === 'completeness'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-indigo-400 hover:text-white hover:bg-indigo-500/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Evidence Completeness (7 Criteria)
          </button>
          <button
            onClick={() => setFilterMode('contradictions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterMode === 'contradictions'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'text-rose-400 hover:text-white hover:bg-rose-500/10'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Contradictions & Conflicts
          </button>
          <button
            onClick={() => setFilterMode('gaps')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterMode === 'gaps'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-white hover:bg-amber-500/10'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Missing Information
          </button>
          <button
            onClick={() => setFilterMode('evidence')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterMode === 'evidence'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-white hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Supporting Proofs
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search within matrix..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* EVIDENCE COMPLETENESS MATRIX VIEW (TASK 3) */}
      {filterMode === 'completeness' ? (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 space-y-1">
            <div className="font-bold flex items-center gap-2 text-indigo-200">
              <Layers className="w-4 h-4 text-indigo-400" /> 7-Criteria Evidence Completeness Indicator
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Every candidate option is systematically evaluated against 7 core decision criteria. Criteria availability is derived directly from ingested documents without hardcoded values. Click any criterion cell to view the supporting source passage or the actionable procurement recommendation.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-2xl bg-slate-900/70 backdrop-blur-md">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-xs">
                  <th className="p-4 w-72 text-slate-400 font-semibold uppercase tracking-wider sticky left-0 bg-slate-950 z-20 shadow-r">
                    Decision Criterion
                  </th>
                  {options.map(opt => {
                    const isSolar = activeWorkspace.domain.toLowerCase().includes('solar') || opt.domainCategory === 'solar_energy';
                    const comp = getOptionCompleteness(opt, isSolar ? 'solar_energy' : 'cloud_infrastructure', activeWorkspace.name);
                    return (
                      <th key={opt.id} className="p-4 w-80 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
                              {opt.badge}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                comp.decisionReadiness === 'decision_ready'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : comp.decisionReadiness === 'conditional'
                                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {comp.decisionReadiness === 'decision_ready'
                                ? 'Decision Ready'
                                : comp.decisionReadiness === 'conditional'
                                ? 'Conditional'
                                : 'Critical Gaps'}
                            </span>
                          </div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            {isSolar && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                            {opt.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Completeness: <span className="font-mono font-bold text-blue-400">{comp.completenessPercentage}%</span> ({comp.availableCount}/{comp.totalCriteria} Available)
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {(() => {
                  const isSolar = activeWorkspace.domain.toLowerCase().includes('solar') || options.some(o => o.domainCategory === 'solar_energy');
                  const firstOpt = options[0];
                  if (!firstOpt) return null;
                  const criteriaTemplate = getOptionCompleteness(firstOpt, isSolar ? 'solar_energy' : 'cloud_infrastructure', activeWorkspace.name).criteria;

                  return criteriaTemplate.map(critTemplate => (
                    <tr key={critTemplate.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 sticky left-0 bg-slate-950/95 z-10 border-r border-slate-800/80">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{critTemplate.label}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              critTemplate.category === 'critical'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : critTemplate.category === 'important'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {critTemplate.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {critTemplate.importanceExplanation}
                          </p>
                        </div>
                      </td>

                      {options.map(opt => {
                        const optComp = getOptionCompleteness(opt, isSolar ? 'solar_energy' : 'cloud_infrastructure', activeWorkspace.name);
                        const crit = optComp.criteria.find(c => c.id === critTemplate.id) || critTemplate;
                        return (
                          <td key={opt.id} className="p-4 align-top">
                            <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                                    crit.status === 'available_source_linked'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : crit.status === 'missing_information'
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  }`}
                                >
                                  {crit.status === 'available_source_linked' ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <HelpCircle className="w-3 h-3" />
                                  )}
                                  {crit.statusLabel}
                                </span>
                              </div>

                              <div className="font-mono text-sm font-bold text-white">
                                {crit.extractedValue !== null && crit.extractedValue !== undefined ? (
                                  crit.extractedValue
                                ) : (
                                  <span className="text-amber-400 italic text-xs font-normal">Not Reported (Missing)</span>
                                )}
                              </div>

                              <button
                                onClick={() => setSelectedCompletenessCriterion({ criterion: crit, optionName: opt.name })}
                                className="w-full text-left text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-between pt-1 border-t border-slate-800/60 transition-colors"
                              >
                                <span>Inspect Citation & Steps</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Main Evidence Matrix Table */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-2xl bg-slate-900/70 backdrop-blur-md">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* Table Header: Candidate Options */}
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90 text-xs">
                <th className="p-4 w-64 text-slate-400 font-semibold uppercase tracking-wider sticky left-0 bg-slate-950 z-20 shadow-r">
                  Evaluation Criteria
                </th>
              {options.map(opt => {
                const simRes = simulationResults.find(r => r.optionId === opt.id);
                return (
                  <th key={opt.id} className="p-4 w-80 align-top">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
                          {opt.badge}
                        </span>
                        {simRes && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              simRes.isEligible
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {simRes.isEligible ? `Eligible (Rank #${simRes.rank})` : 'Disqualified'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">{opt.name}</h3>
                      <p className="text-[11px] text-slate-400 font-normal line-clamp-2">{opt.tagline}</p>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
            {/* Row: Cost Profile */}
            {(filterMode === 'all' || filterMode === 'evidence') && (
              <tr className="hover:bg-slate-850/40 transition-colors">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Monthly Run-rate (TCO)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Estimated at 85M req/day</span>
                </td>
                {options.map(opt => (
                  <td key={opt.id} className="p-4 align-top">
                    <div className="text-base font-bold text-white font-sans">
                      {formatCurrency(opt.baseMonthlyCost)}
                      <span className="text-xs font-normal text-slate-400"> / month</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      FinOps Efficiency: <span className="font-semibold text-emerald-400">{opt.criteriaRatings.costEfficiency}%</span>
                    </div>
                  </td>
                ))}
              </tr>
            )}

            {/* Row: Latency / SLA */}
            {(filterMode === 'all' || filterMode === 'evidence') && (
              <tr className="hover:bg-slate-850/40 transition-colors">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>p99 Tail Latency</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Under burst concurrency load</span>
                </td>
                {options.map(opt => (
                  <td key={opt.id} className="p-4 align-top">
                    <div className="text-base font-bold text-white font-sans">
                      {formatLatency(opt.baseLatencyMs)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Performance Rating: <span className="font-semibold text-blue-400">{opt.criteriaRatings.performance}%</span>
                    </div>
                  </td>
                ))}
              </tr>
            )}

            {/* Row: Footprint / Space */}
            {(filterMode === 'all' || filterMode === 'evidence') && (
              <tr className="hover:bg-slate-850/40 transition-colors">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    <span>Physical Space / Racks</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Colocation lease space</span>
                </td>
                {options.map(opt => (
                  <td key={opt.id} className="p-4 align-top">
                    <div className="font-bold text-white">
                      {opt.spaceRequiredUnits > 0 ? `${opt.spaceRequiredUnits} Rack Units (Equinix)` : '0 Racks (Cloud Native)'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Lead Time: {opt.implementationMonths} Months
                    </div>
                  </td>
                ))}
              </tr>
            )}

            {/* Row: Compliance Attestations */}
            {(filterMode === 'all' || filterMode === 'evidence') && (
              <tr className="hover:bg-slate-850/40 transition-colors">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Regulatory Frameworks</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Security attestations</span>
                </td>
                {options.map(opt => (
                  <td key={opt.id} className="p-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {opt.supportedCompliance.map(comp => (
                        <span
                          key={comp}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-blue-300 border border-slate-700"
                        >
                          {comp.toUpperCase().replace('_', ' / ')}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            )}

            {/* Row: Supporting Evidence & Proofs */}
            {(filterMode === 'all' || filterMode === 'evidence') && (
              <tr className="bg-emerald-950/10 hover:bg-emerald-950/15 transition-colors">
                <td className="p-4 font-semibold text-emerald-400 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Supporting Evidence</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                    Peer-reviewed & benchmark citations
                  </span>
                </td>
                {options.map(opt => (
                  <td key={opt.id} className="p-4 align-top space-y-2.5">
                    {opt.supportingEvidence.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvidence(ev)}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 transition-colors cursor-pointer text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 line-clamp-1">{ev.title}</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
                            {ev.empiricalScore}%
                          </span>
                        </div>
                        <p className="text-[11px] italic text-slate-400 line-clamp-2">
                          "{ev.quote}"
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span className="truncate max-w-[180px]">{ev.docTitle}</span>
                          <span className="text-blue-400 font-medium hover:underline">View Proof</span>
                        </div>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            )}

            {/* Row: Contradictions & Conflict Flags */}
            {(filterMode === 'all' || filterMode === 'contradictions') && (
              <tr className="bg-rose-950/10 hover:bg-rose-950/15 transition-colors">
                <td className="p-4 font-semibold text-rose-400 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Contradictions & Conflicts</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                    Empirical data vs vendor assertions
                  </span>
                </td>
                {options.map(opt => (
                  <td key={opt.id} className="p-4 align-top space-y-2.5">
                    {opt.contradictions.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950/40 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>No conflicting evidence detected</span>
                      </div>
                    ) : (
                      opt.contradictions.map(con => (
                        <div
                          key={con.id}
                          onClick={() => setSelectedContradiction(con)}
                          className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 hover:border-rose-500/60 transition-colors cursor-pointer text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-300 line-clamp-1">{con.title}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                              {con.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2">{con.description}</p>
                          <div className="text-[10px] text-rose-400/90 pt-1 flex items-center justify-between">
                            <span className="capitalize">{con.resolutionStatus}</span>
                            <span className="underline">Inspect Conflict</span>
                          </div>
                        </div>
                      ))
                    )}
                  </td>
                ))}
              </tr>
            )}

            {/* Row: Missing Information & Knowledge Gaps */}
            {(filterMode === 'all' || filterMode === 'gaps') && (
              <tr className="bg-amber-950/10 hover:bg-amber-950/15 transition-colors">
                <td className="p-4 font-semibold text-amber-400 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Missing Information / Gaps</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                    Data gaps requiring investigation
                  </span>
                </td>
                {options.map(opt => (
                  <td key={opt.id} className="p-4 align-top space-y-2">
                    {opt.missingInfo.map((gap, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed">{gap}</span>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

      {/* Contradiction Detail Modal */}
      {selectedContradiction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedContradiction.title}</h3>
                  <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {selectedContradiction.severity} Severity Discrepancy
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedContradiction(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {selectedContradiction.description}
            </p>

            {/* Conflicting Sources Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  Source Claim A (Vendor Assertion)
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {selectedContradiction.sourceA.docTitle}
                </div>
                <blockquote className="text-[11px] italic text-slate-400 border-l-2 border-blue-500/50 pl-2">
                  "{selectedContradiction.sourceA.claim}"
                </blockquote>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 space-y-2">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Source Claim B (Empirical Benchmark)
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {selectedContradiction.sourceB.docTitle}
                </div>
                <blockquote className="text-[11px] italic text-slate-400 border-l-2 border-rose-500/50 pl-2">
                  "{selectedContradiction.sourceB.claim}"
                </blockquote>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
              <span className="font-bold">Architectural Impact: </span>
              {selectedContradiction.impact}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedContradiction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
              >
                Close Conflict Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Proof Detail Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedEvidence.title}</h3>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    Empirical Proof Rating: {selectedEvidence.empiricalScore}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Verified Document</span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedEvidence.docTitle}</p>
            </div>

            <blockquote className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs italic text-slate-300 border-l-4 border-l-emerald-500">
              "{selectedEvidence.quote}"
            </blockquote>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <span>Verification Weight: {selectedEvidence.weight} / 10</span>
              <span>Triangulated: {selectedEvidence.verifiedDate}</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Completeness Criterion Detail Modal */}
      {selectedCompletenessCriterion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                    {selectedCompletenessCriterion.criterion.category} Criterion
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Candidate: {selectedCompletenessCriterion.optionName}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedCompletenessCriterion.criterion.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCompletenessCriterion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Status</span>
                <span
                  className={`inline-flex items-center gap-1 mt-1 font-semibold px-2 py-0.5 rounded-full text-[11px] border ${
                    selectedCompletenessCriterion.criterion.status === 'available_source_linked'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : selectedCompletenessCriterion.criterion.status === 'missing_information'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}
                >
                  {selectedCompletenessCriterion.criterion.statusLabel}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Extracted Value</span>
                <span className="font-mono font-bold text-white text-sm mt-1 block">
                  {selectedCompletenessCriterion.criterion.extractedValue ?? 'Not Reported (Missing)'}
                </span>
              </div>
            </div>

            {selectedCompletenessCriterion.criterion.rawSourcePassage && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" /> Source Passage Provenance
                </span>
                <blockquote className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 border-l-4 border-l-blue-500 text-xs italic text-slate-300 font-mono">
                  "{selectedCompletenessCriterion.criterion.rawSourcePassage}"
                </blockquote>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Document: {selectedCompletenessCriterion.criterion.sourceDocument}</span>
                  <span>Section: {selectedCompletenessCriterion.criterion.sourceSection} (Page {selectedCompletenessCriterion.criterion.pageNumber})</span>
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-1">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-400" /> Decision Impact: Why This Matters
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedCompletenessCriterion.criterion.importanceExplanation}
              </p>
            </div>

            {selectedCompletenessCriterion.criterion.recommendation && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400" /> Actionable Next Steps
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCompletenessCriterion.criterion.recommendation}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCompletenessCriterion(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
