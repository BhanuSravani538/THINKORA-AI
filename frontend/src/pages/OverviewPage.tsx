import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { MetricCard } from '../components/common/MetricCard';
import {
  ShieldAlert,
  CheckCircle2,
  Sliders,
  Network,
  FileText,
  Sparkles,
  ArrowRight,
  Layers,
  Zap,
  AlertCircle,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatLatency } from '../utils/decisionEngine';

interface OverviewPageProps {
  onOpenCreateWorkspace?: () => void;
  onOpenUploadDoc?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = () => {
  const {
    activeWorkspace,
    workspaces,

    options,
    simulationResults,
    activities,
    setActiveWorkspaceId,
  } = useWorkspace();
  const navigate = useNavigate();

  const winningOption = simulationResults.length > 0
    ? options.find(o => o.id === simulationResults[0].optionId)
    : null;
  const topResult = simulationResults[0];

  const totalContradictions = options.reduce(
    (acc, opt) => acc + opt.contradictions.length,
    0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Active Workspace Context */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800/80 p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {activeWorkspace.domain}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Confidence Grade {activeWorkspace.confidenceGrade}
              </span>
              <span className="text-xs text-slate-400">
                Last updated {activeWorkspace.lastActive}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeWorkspace.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeWorkspace.description}
            </p>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
              <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Decision Objective: </span>
                {activeWorkspace.decisionGoal}
              </div>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => navigate('/simulator')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <Sliders className="w-4 h-4" />
              <span>Launch Simulator</span>
            </button>
            <button
              onClick={() => navigate('/evidence')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Evidence Matrix</span>
            </button>
            <button
              onClick={() => navigate('/graph')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Network className="w-4 h-4 text-purple-400" />
              <span>Explore Graph</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Evidence Completeness"
          value={`${activeWorkspace.completionPercentage}%`}
          subtitle="Triangulated claims & docs"
          icon={Layers}
          trend={{ value: '+14%', isPositive: true, label: 'this week' }}
          glowColor="emerald"
        />
        <MetricCard
          title="Validated Claims"
          value={activeWorkspace.claimsCount}
          subtitle="From 6 verified benchmarks"
          icon={CheckCircle2}
          trend={{ value: '94%', isPositive: true, label: 'avg confidence' }}
          glowColor="blue"
        />
        <MetricCard
          title="Contradictions Flagged"
          value={totalContradictions}
          subtitle="Vendor SLA vs Empirical tests"
          icon={ShieldAlert}
          trend={{ value: '2 Critical', isPositive: false, label: 'need review' }}
          glowColor="amber"
          onClick={() => navigate('/evidence')}
        />
        <MetricCard
          title="Decision Candidates"
          value={options.length}
          subtitle={winningOption ? `Top: ${winningOption.name.split(' ')[0]}` : 'Ready to score'}
          icon={Zap}
          trend={{ value: topResult ? `Rank #1: ${topResult.compositeScore} pts` : '', isPositive: true }}
          glowColor="purple"
          onClick={() => navigate('/simulator')}
        />
      </div>

      {/* Main Two-Column Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Decision Options Real-Time Standing */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" /> Current Option Standing & Eligibility
              </h2>
              <p className="text-xs text-slate-400">
                Real-time scores dynamically evaluated against current constraints
              </p>
            </div>
            <button
              onClick={() => navigate('/simulator')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Open Simulator <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {options.map(option => {
              const result = simulationResults.find(r => r.optionId === option.id);
              const isEligible = result ? result.isEligible : true;
              const isTop = result?.rank === 1;

              return (
                <div
                  key={option.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isTop
                      ? 'bg-blue-950/20 border-blue-500/40 shadow-xl shadow-blue-500/5'
                      : !isEligible
                      ? 'bg-slate-900/40 border-rose-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                          isTop
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : !isEligible
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{result?.rank || '-'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{option.name}</h3>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              isTop
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {option.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{option.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Composite Score</div>
                        <div
                          className={`text-xl font-extrabold ${
                            result?.compositeScore && result.compositeScore >= 80
                              ? 'text-emerald-400'
                              : result?.compositeScore && result.compositeScore >= 60
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {result?.compositeScore ?? option.confidenceScore}
                          <span className="text-xs text-slate-500 font-normal"> / 100</span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          result?.status === 'eligible'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : result?.status === 'at_risk'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {result?.status === 'eligible'
                          ? 'Eligible'
                          : result?.status === 'at_risk'
                          ? 'At-Risk'
                          : 'Disqualified'}
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block">Monthly Cost</span>
                      <span className="font-semibold text-slate-200">
                        {formatCurrency(option.baseMonthlyCost)}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block">p99 Latency</span>
                      <span className="font-semibold text-slate-200">
                        {formatLatency(option.baseLatencyMs)}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block">Footprint</span>
                      <span className="font-semibold text-slate-200">
                        {option.spaceRequiredUnits > 0 ? `${option.spaceRequiredUnits} Racks` : 'Serverless'}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block">Lead Time</span>
                      <span className="font-semibold text-slate-200">
                        {option.implementationMonths} Months
                      </span>
                    </div>
                  </div>

                  {/* Failure / Risk Reason Banner if Disqualified */}
                  {result && !result.isEligible && result.reasons.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Disqualification Trigger: </span>
                        {result.reasons[0]}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Recent Activity & Evidence Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Evidence Activity Feed
            </h2>
            <span className="text-xs text-slate-500">Real-time</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            {activities.slice(0, 5).map(act => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/70 text-xs space-y-1 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-semibold truncate ${
                      act.severity === 'alert'
                        ? 'text-rose-400'
                        : act.severity === 'warning'
                        ? 'text-amber-400'
                        : act.severity === 'success'
                        ? 'text-emerald-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {act.title}
                  </span>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">{act.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{act.description}</p>
                <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between">
                  <span>{act.workspaceName}</span>
                </div>
              </div>
            ))}

            <button
              onClick={() => navigate('/documents')}
              className="w-full py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" /> View Ingested Documents
            </button>
          </div>

          {/* Quick Workspaces Glancer */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Other Workspaces</span>
              <button
                onClick={() => navigate('/workspaces')}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                View all ({workspaces.length})
              </button>
            </div>
            <div className="space-y-2">
              {workspaces
                .filter(w => w.id !== activeWorkspace.id)
                .slice(0, 3)
                .map(w => (
                  <div
                    key={w.id}
                    onClick={() => setActiveWorkspaceId(w.id)}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-blue-500/40 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="font-semibold text-slate-200 truncate">{w.name}</div>
                      <div className="text-[10px] text-slate-400">{w.domain}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-blue-300">
                      {w.confidenceGrade}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
