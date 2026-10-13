import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  DollarSign,
  Zap,
  HardDrive,
  Shield,
  Clock,
  ChevronRight,
  Scale,
  Award,
  AlertCircle,
  Bookmark,
  Sun,
  FileText,
  CheckCircle2,
  Layers,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  X,
  Compass,
} from 'lucide-react';
import { formatCurrency, formatLatency } from '../utils/decisionEngine';
import { getOptionCompleteness } from '../utils/evidenceCompleteness';
import type { OptionCriterionCompleteness } from '../types';

export const DecisionSimulatorPage: React.FC = () => {
  const {
    options,
    constraints,
    updateConstraint,
    updatePriorityWeight,
    simulationResults,
    baselineResults,
    activePresetId,
    applyPreset,
    resetConstraints,
    activeWorkspace,
    addActivity,
    isSolarWorkspace,
    availablePresets,
  } = useWorkspace();

  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [completenessExpandedOptionId, setCompletenessExpandedOptionId] = useState<string | null>(null);
  const [inspectedCriterion, setInspectedCriterion] = useState<{ criterion: OptionCriterionCompleteness; optionName: string } | null>(null);
  const [showWeights, setShowWeights] = useState(false);
  const [scenarioSaved, setScenarioSaved] = useState(false);

  // Check if constraints differ from baseline
  const isCustomScenario =
    activePresetId !== (isSolarWorkspace ? 'preset-solar-balanced' : 'preset-balanced');

  const handleSaveScenario = () => {
    setScenarioSaved(true);
    addActivity({
      type: 'simulation_run',
      title: 'Simulation snapshot recorded',
      description: isSolarWorkspace
        ? `Solar scenario with Budget $${constraints.budgetLimit.toLocaleString()}, Space ${(constraints.availableRoofSpace ?? 9000).toLocaleString()} sq ft, Min Energy ${constraints.minDailyEnergyDemand ?? 650} kWh/day saved.`
        : `Cloud scenario with Budget ${formatCurrency(constraints.budgetLimit)}, Latency ${constraints.maxLatencyMs}ms saved.`,
      workspaceId: activeWorkspace.id,
      workspaceName: activeWorkspace.name,
      severity: 'success',
    });
    setTimeout(() => setScenarioSaved(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
              {isSolarWorkspace ? <Sun className="w-3 h-3 text-amber-400" /> : null}
              {activeWorkspace.domain}
            </span>
            <span className="text-xs text-slate-400">Interactive Simulation Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Sliders className="w-6 h-6 text-blue-400" /> Dynamic Decision Simulator & What-If Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {isSolarWorkspace
              ? 'Evaluate candidate solar configurations against budget caps, available roof space, and daily campus energy demands in real time.'
              : 'Adjust budget thresholds, latency tolerances, and physical space constraints to test architectural resilience in real time.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={resetConstraints}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            onClick={handleSaveScenario}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{scenarioSaved ? 'Saved Snapshot!' : 'Save Scenario'}</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Selector */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Rapid "What-If" Scenario Presets:
          </span>
          <span className="text-[11px] text-slate-500">1-click parameter simulation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {availablePresets.map(preset => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold truncate flex items-center justify-between">
                  <span>{preset.name}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* What-If Live Analysis Alert Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isCustomScenario
            ? 'bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900/80 border-blue-500/40 shadow-xl shadow-blue-500/5'
            : 'bg-slate-900/40 border-slate-800/80'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {isCustomScenario ? 'What-If Dynamic Constraint Delta Active' : 'Baseline Constraint Model Active'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Live Deterministic Recalculation
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isSolarWorkspace ? (
                <>
                  Budget: <span className="text-white font-semibold">${constraints.budgetLimit.toLocaleString()}</span> •{' '}
                  Roof Space: <span className="text-white font-semibold">{(constraints.availableRoofSpace ?? 9000).toLocaleString()} sq ft</span> •{' '}
                  Min Demand: <span className="text-white font-semibold">{constraints.minDailyEnergyDemand ?? 650} kWh/day</span>
                </>
              ) : (
                <>
                  Budget: <span className="text-white font-semibold">{formatCurrency(constraints.budgetLimit)}/mo</span> •{' '}
                  p99 Latency: <span className="text-white font-semibold">{formatLatency(constraints.maxLatencyMs)}</span> •{' '}
                  Space: <span className="text-white font-semibold">{constraints.maxSpaceUnits} Racks</span> •{' '}
                  Compliance: <span className="text-white font-semibold uppercase">{constraints.requiredCompliance.replace('_', ' / ')}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Eligible Options</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono">
              {simulationResults.filter(r => r.isEligible).length} / {options.length}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Layout: Controls (Left) and Results Board (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" /> Constraint Thresholds
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Deterministic Rules</span>
            </div>

            {/* DOMAIN 1: SOLAR / CLEAN ENERGY CONTROLS */}
            {isSolarWorkspace ? (
              <div className="space-y-5">
                {/* 1. Solar Budget Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Capital Expenditure Budget Limit
                    </label>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ₹{(constraints.budgetLimit / 100000).toFixed(constraints.budgetLimit % 100000 === 0 ? 0 : 1)} Lakh (₹{constraints.budgetLimit.toLocaleString()})
                    </span>
                  </div>
                  <input
                    type="range"
                    min={200000}
                    max={1000000}
                    step={25000}
                    value={constraints.budgetLimit}
                    onChange={e => updateConstraint('budgetLimit', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>₹2L (Tight)</span>
                    <span>₹5L (Baseline Envelope)</span>
                    <span>₹10L (Uncapped)</span>
                  </div>
                </div>

                {/* 2. Available Roof Space Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-purple-400" /> Available Roof Footprint Space
                    </label>
                    <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {(constraints.availableRoofSpace ?? 1000).toLocaleString()} sq ft
                    </span>
                  </div>
                  <input
                    type="range"
                    min={400}
                    max={1500}
                    step={50}
                    value={constraints.availableRoofSpace ?? 1000}
                    onChange={e => updateConstraint('availableRoofSpace', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>400 sq ft (Restricted)</span>
                    <span>1,000 sq ft (Baseline)</span>
                    <span>1,500 sq ft (Expansive)</span>
                  </div>
                </div>

                {/* 3. Minimum Daily Energy Demand Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Minimum Daily Energy Demand
                    </label>
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {constraints.minDailyEnergyDemand ?? 75} kWh/day
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    step={5}
                    value={constraints.minDailyEnergyDemand ?? 75}
                    onChange={e => updateConstraint('minDailyEnergyDemand', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50 kWh/day (Baseload)</span>
                    <span>75 kWh/day (Baseline)</span>
                    <span>150 kWh/day (High Demand)</span>
                  </div>
                </div>

                {/* 4. Priority Weights */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowWeights(!showWeights)}
                    className="w-full text-left text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" /> Clean Energy Priority Weights
                    </span>
                    <span>{showWeights ? 'Hide' : 'Configure (4 Criteria)'}</span>
                  </button>

                  {showWeights && (
                    <div className="mt-3 space-y-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 animate-in fade-in">
                      {[
                        { key: 'cost', label: 'Cost Priority (Low CapEx)', val: constraints.priorityWeights.cost },
                        { key: 'performance', label: 'Energy Generation Yield', val: constraints.priorityWeights.performance },
                        { key: 'spaceEfficiency', label: 'Roof Area Efficiency', val: constraints.priorityWeights.spaceEfficiency ?? 4 },
                        { key: 'risk', label: 'Empirical Evidence Rigor', val: constraints.priorityWeights.risk },
                      ].map(item => (
                        <div key={item.key} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300">{item.label}</span>
                            <span className="font-bold text-blue-400 font-mono">Weight {item.val}</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            step={1}
                            value={item.val}
                            onChange={e =>
                              updatePriorityWeight(
                                item.key as any,
                                Number(e.target.value)
                              )
                            }
                            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* DOMAIN 2: CLOUD INFRASTRUCTURE CONTROLS (Preserved Sample Workspace) */
              <div className="space-y-5">
                {/* 1. Monthly Budget Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Monthly Budget Envelope
                    </label>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {formatCurrency(constraints.budgetLimit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={70000}
                    max={220000}
                    step={5000}
                    value={constraints.budgetLimit}
                    onChange={e => updateConstraint('budgetLimit', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>$70k/mo (Strict)</span>
                    <span>$140k (Baseline)</span>
                    <span>$220k/mo (Uncapped)</span>
                  </div>
                </div>

                {/* 2. Latency Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" /> Max Acceptable p99 Latency
                    </label>
                    <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {formatLatency(constraints.maxLatencyMs)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    step={2}
                    value={constraints.maxLatencyMs}
                    onChange={e => updateConstraint('maxLatencyMs', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10ms (Real-time)</span>
                    <span>25ms (SLA)</span>
                    <span>50ms (Tolerant)</span>
                  </div>
                </div>

                {/* 3. Space / Rack Footprint Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-purple-400" /> Max Available Space / Racks
                    </label>
                    <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {constraints.maxSpaceUnits} Rack Units
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={24}
                    step={2}
                    value={constraints.maxSpaceUnits}
                    onChange={e => updateConstraint('maxSpaceUnits', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>2 Racks (Lean)</span>
                    <span>12 Racks (Mid)</span>
                    <span>24 Racks (Dedicated)</span>
                  </div>
                </div>

                {/* 4. Mandatory Compliance Tier */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" /> Mandatory Compliance Tier
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {(['standard', 'soc2_hipaa', 'sovereign_airgap'] as const).map(tier => {
                      const isSelected = constraints.requiredCompliance === tier;
                      const label =
                        tier === 'standard'
                          ? 'Standard'
                          : tier === 'soc2_hipaa'
                          ? 'SOC2/HIPAA'
                          : 'Air-Gapped';
                      return (
                        <button
                          key={tier}
                          onClick={() => updateConstraint('requiredCompliance', tier)}
                          className={`py-2 px-1 rounded-xl text-center font-semibold text-[11px] transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Implementation Timeline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Max Deployment Window
                    </label>
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {constraints.maxImplementationMonths} Months
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={18}
                    step={1}
                    value={constraints.maxImplementationMonths}
                    onChange={e => updateConstraint('maxImplementationMonths', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>3 Mo (Fast)</span>
                    <span>10 Mo</span>
                    <span>18 Mo (Multi-year)</span>
                  </div>
                </div>

                {/* 6. Priority Weights */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowWeights(!showWeights)}
                    className="w-full text-left text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" /> Multi-Criteria Priority Weights
                    </span>
                    <span>{showWeights ? 'Hide' : 'Configure (5 Criteria)'}</span>
                  </button>

                  {showWeights && (
                    <div className="mt-3 space-y-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 animate-in fade-in">
                      {[
                        { key: 'cost', label: 'Cost Priority', val: constraints.priorityWeights.cost },
                        { key: 'performance', label: 'Performance Priority', val: constraints.priorityWeights.performance },
                        { key: 'compliance', label: 'Compliance Rigor', val: constraints.priorityWeights.compliance },
                        { key: 'timeToValue', label: 'Speed to Market', val: constraints.priorityWeights.timeToValue },
                        { key: 'risk', label: 'Empirical Proof Rigor', val: constraints.priorityWeights.risk },
                      ].map(item => (
                        <div key={item.key} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300">{item.label}</span>
                            <span className="font-bold text-blue-400 font-mono">Weight {item.val}</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            step={1}
                            value={item.val}
                            onChange={e =>
                              updatePriorityWeight(
                                item.key as any,
                                Number(e.target.value)
                              )
                            }
                            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Evaluated Candidate Rankings & Status
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Deterministic Rule-Engine</span>
            </div>
          </div>

          <div className="space-y-4">
            {simulationResults.map(res => {
              const opt = options.find(o => o.id === res.optionId);
              if (!opt) return null;

              const baseline = baselineResults.find(b => b.optionId === res.optionId);
              const scoreDelta = baseline ? res.compositeScore - baseline.compositeScore : 0;
              const isExpanded = expandedOptionId === opt.id;
              const isSolarOption = opt.domainCategory === 'solar_energy' || opt.estimatedCost !== undefined;

              return (
                <div
                  key={opt.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    res.rank === 1 && res.isEligible
                      ? 'bg-gradient-to-br from-blue-950/30 via-slate-900/90 to-slate-900 border-blue-500/50 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/20'
                      : res.status === 'insufficient_evidence'
                      ? 'bg-amber-950/15 border-amber-500/40 shadow-md'
                      : !res.isEligible
                      ? 'bg-slate-900/40 border-rose-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Top Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                          res.rank === 1 && res.isEligible
                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                            : res.status === 'insufficient_evidence'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : !res.isEligible
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{res.rank}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {isSolarOption && <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            {opt.name}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{opt.tagline}</p>

                        {/* Evidence Completeness Indicator Pill & Toggle */}
                        {(() => {
                          const completeness = getOptionCompleteness(opt, isSolarOption ? 'solar_energy' : 'cloud_infrastructure', activeWorkspace.name);
                          return (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                                  completeness.decisionReadiness === 'decision_ready'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : completeness.decisionReadiness === 'conditional'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                <Layers className="w-3 h-3" />
                                Completeness: {completeness.completenessPercentage}% ({completeness.availableCount}/{completeness.totalCriteria} Criteria)
                              </span>

                              <button
                                onClick={() => setCompletenessExpandedOptionId(completenessExpandedOptionId === opt.id ? null : opt.id)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 flex items-center gap-0.5 transition-colors"
                              >
                                {completenessExpandedOptionId === opt.id ? 'Hide Criteria Matrix' : 'Inspect 7 Criteria'}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Composite Score</div>
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span
                            className={`text-2xl font-black font-sans ${
                              res.isEligible ? 'text-white' : 'text-slate-500 line-through opacity-70'
                            }`}
                          >
                            {res.compositeScore}
                          </span>
                          <span className="text-xs text-slate-500">/ 100</span>

                          {scoreDelta !== 0 && (
                            <span
                              className={`text-[11px] font-bold ${
                                scoreDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              ({scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta})
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          res.status === 'eligible'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : res.status === 'at_risk'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : res.status === 'insufficient_evidence'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {res.status === 'eligible'
                          ? 'Eligible'
                          : res.status === 'at_risk'
                          ? 'At-Risk'
                          : res.status === 'insufficient_evidence'
                          ? 'Insufficient Evidence'
                          : 'Disqualified'}
                      </span>
                    </div>
                  </div>

                  {/* DOMAIN SPECIFIC CRITERIA SUMMARY TILES */}
                  {isSolarOption ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
                      {/* Cost Metric */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-semibold">Estimated Cost</span>
                          {opt.estimatedCost === null || opt.estimatedCost === undefined ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Not Reported
                            </span>
                          ) : (
                            <span
                              className={`font-semibold ${
                                opt.estimatedCost <= constraints.budgetLimit
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {opt.estimatedCost <= constraints.budgetLimit
                                ? 'Within Budget'
                                : 'Exceeds Budget'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {opt.estimatedCost !== null && opt.estimatedCost !== undefined ? (
                            opt.costFormatted || `₹${(opt.estimatedCost / 100000).toFixed(1)} Lakh (₹${opt.estimatedCost.toLocaleString()})`
                          ) : (
                            <span className="text-amber-400 italic font-mono text-xs">
                              Not reported (Unknown)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Limit: ₹{(constraints.budgetLimit / 100000).toFixed(constraints.budgetLimit % 100000 === 0 ? 0 : 1)} Lakh (₹{constraints.budgetLimit.toLocaleString()})
                        </div>
                      </div>

                      {/* Roof Space Metric */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-semibold">Required Roof Space</span>
                          <span
                            className={`font-semibold ${
                              opt.roofSpaceRequired &&
                              opt.roofSpaceRequired <= (constraints.availableRoofSpace ?? 1000)
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {opt.roofSpaceRequired &&
                            opt.roofSpaceRequired <= (constraints.availableRoofSpace ?? 1000)
                              ? 'Fits Space'
                              : 'Exceeds Space'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {opt.roofSpaceRequired?.toLocaleString() ?? 'Unknown'} sq ft
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Available: {(constraints.availableRoofSpace ?? 1000).toLocaleString()} sq ft
                        </div>
                      </div>

                      {/* Daily Energy Generation Metric */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-semibold">Daily Energy Output</span>
                          {opt.dailyEnergyOutput === null || opt.dailyEnergyOutput === undefined ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Missing
                            </span>
                          ) : opt.dailyEnergyOutput >= (constraints.minDailyEnergyDemand ?? 75) ? (
                            <span className="text-emerald-400 font-semibold">Meets Demand</span>
                          ) : (
                            <span className="text-rose-400 font-semibold">Under Target</span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {opt.dailyEnergyOutput !== null && opt.dailyEnergyOutput !== undefined ? (
                            `${opt.dailyEnergyOutput} kWh/day`
                          ) : (
                            <span className="text-amber-400 italic font-mono text-xs">
                              Unknown (Unreported)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Demand: {constraints.minDailyEnergyDemand ?? 75} kWh/day min
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Disqualification / Hard Constraint Violations Banner */}
                  {!res.isEligible && res.reasons.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-200">
                        <AlertCircle className="w-4 h-4 text-rose-400" /> Deterministic Constraint Violations ({res.reasons.length}):
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] pl-1 font-mono">
                        {res.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Insufficient Evidence & Critical Missing Criteria Warning */}
                  {(() => {
                    const completeness = getOptionCompleteness(opt, isSolarOption ? 'solar_energy' : 'cloud_infrastructure', activeWorkspace.name);
                    if (res.status === 'insufficient_evidence' || completeness.criticalMissing.length > 0) {
                      return (
                        <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1.5">
                          <div className="font-bold flex items-center gap-1.5 text-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            Critical Evidence Gap: Cannot Declare as Definitively Best Option
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {completeness.criticalMissing.length > 0
                              ? `Critical decision criteria (${completeness.criticalMissing.map(c => c.label).join(', ')}) are missing from the source document. In accordance with research integrity standards, this candidate cannot be ranked as the recommended winner until verified figures are obtained.`
                              : `The document does not supply required values for evaluating this option. To maintain research integrity, missing values are flagged as unknown rather than assigning fabricated assumptions.`}
                          </p>
                          <div className="text-[11px] text-amber-300 font-medium pt-1 flex items-start gap-1.5 bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>Actionable Next Step: {completeness.summaryRecommendation}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Sensitivity Warnings Banner */}
                  {res.isEligible && res.warningReasons.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-400" /> Sensitivity / Boundary Warnings:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1 font-mono">
                        {res.warningReasons.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Score Breakdown Bars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Cost Fit</span>
                        <span className="font-semibold text-slate-200 font-mono">{res.costScore}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: `${res.costScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{isSolarOption ? 'Yield Fit' : 'Latency Fit'}</span>
                        <span className="font-semibold text-slate-200 font-mono">{res.performanceScore}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full rounded-full transition-all" style={{ width: `${res.performanceScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{isSolarOption ? 'Space Efficiency' : 'Compliance'}</span>
                        <span className="font-semibold text-slate-200 font-mono">{res.complianceScore}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full transition-all" style={{ width: `${res.complianceScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Timeline / Maturity</span>
                        <span className="font-semibold text-slate-200 font-mono">{res.timeScore}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${res.timeScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Expandable 7-Criteria Evidence Completeness Matrix */}
                  {completenessExpandedOptionId === opt.id && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-400" /> 7 Decision Criteria Breakdown & Audit Trail
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Click any criterion to inspect citations
                        </span>
                      </div>

                      {(() => {
                        const completeness = getOptionCompleteness(opt, isSolarOption ? 'solar_energy' : 'cloud_infrastructure', activeWorkspace.name);
                        return (
                          <div className="grid grid-cols-1 gap-2">
                            {completeness.criteria.map(c => (
                              <button
                                key={c.id}
                                onClick={() => setInspectedCriterion({ criterion: c, optionName: opt.name })}
                                className="w-full text-left p-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-800/80 border border-slate-800 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 group"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                                      {c.label}
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                      c.category === 'critical'
                                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                        : c.category === 'important'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {c.category}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">{c.importanceExplanation}</p>
                                </div>

                                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                                  <span className="text-xs font-mono font-bold text-white">
                                    {c.extractedValue !== null && c.extractedValue !== undefined
                                      ? `${c.extractedValue}`
                                      : 'Not Reported'}
                                  </span>

                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                                      c.status === 'available_source_linked'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : c.status === 'missing_information'
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    }`}
                                  >
                                    {c.status === 'available_source_linked' ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <HelpCircle className="w-3 h-3" />
                                    )}
                                    {c.statusLabel}
                                  </span>

                                  <span className="text-[10px] text-blue-400 font-semibold group-hover:underline flex items-center gap-0.5">
                                    Inspect <ArrowRight className="w-3 h-3" />
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Expand / Collapse Details Button */}
                  <div className="mt-3 pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] flex items-center gap-1.5">
                      <span className="font-semibold text-slate-300">{opt.supportingEvidence.length}</span> verified proofs •{' '}
                      <span className="font-semibold text-slate-300">{opt.contradictions.length}</span> contradictions
                    </span>
                    <button
                      onClick={() => setExpandedOptionId(isExpanded ? null : opt.id)}
                      className="text-blue-400 hover:text-blue-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      {isExpanded ? 'Hide Evidence & Citations' : 'Inspect Evidence Citations & Details'}
                      <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded Evidence & Architectural Details Drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-4 text-xs animate-in fade-in">
                      {/* Document Citations for Extracted Metrics */}
                      {opt.metricCitations && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Extracted Evidence Citations
                          </span>
                          <div className="space-y-2">
                            {Object.entries(opt.metricCitations).map(([k, metric]) => {
                              if (!metric) return null;
                              return (
                                <div key={k} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-[11px] space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-200">{metric.label}:</span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                        metric.status === 'verified'
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      }`}
                                    >
                                      {metric.status === 'verified'
                                        ? `Verified (${metric.value?.toLocaleString()} ${metric.unit})`
                                        : 'Missing / Unverified in Document'}
                                    </span>
                                  </div>
                                  {metric.citation ? (
                                    <blockquote className="border-l-2 border-blue-500/50 pl-2.5 italic text-slate-400 text-[10px]">
                                      "{metric.citation.quote}"
                                      <span className="block text-[9px] text-blue-400 not-italic mt-0.5">
                                        Source: {metric.citation.docTitle} ({metric.citation.section})
                                      </span>
                                    </blockquote>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* AI Qualitative Synthesis */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Candidate Evaluation Summary
                          </span>
                          <span className="text-[10px] text-slate-500">Document Ingestion & AI Synthesis</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                          {opt.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Key Strengths (Pros)
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                            {opt.pros.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Key Constraints & Risks (Cons)
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                            {opt.cons.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Criterion Inspection Modal */}
      {inspectedCriterion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                    {inspectedCriterion.criterion.category} Criterion
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Option: {inspectedCriterion.optionName}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {inspectedCriterion.criterion.label}
                </h3>
              </div>
              <button
                onClick={() => setInspectedCriterion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Extracted Value */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Verification Status</span>
                <span
                  className={`inline-flex items-center gap-1 mt-1 font-semibold px-2 py-0.5 rounded-full text-[11px] border ${
                    inspectedCriterion.criterion.status === 'available_source_linked'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : inspectedCriterion.criterion.status === 'missing_information'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}
                >
                  {inspectedCriterion.criterion.statusLabel}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Document Extracted Value</span>
                <span className="font-mono font-bold text-white text-sm mt-1 block">
                  {inspectedCriterion.criterion.extractedValue ?? 'None / Not Reported'}
                </span>
              </div>
            </div>

            {/* Source Provenance */}
            {inspectedCriterion.criterion.rawSourcePassage && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" /> Source Passage Provenance
                </span>
                <blockquote className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 border-l-4 border-l-blue-500 text-xs text-slate-300 italic font-mono leading-relaxed">
                  "{inspectedCriterion.criterion.rawSourcePassage}"
                </blockquote>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Document: {inspectedCriterion.criterion.sourceDocument}</span>
                  <span>Section: {inspectedCriterion.criterion.sourceSection} (Page {inspectedCriterion.criterion.pageNumber})</span>
                </div>
              </div>
            )}

            {/* Why Missing Information Matters */}
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-1">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-400" /> Decision Impact: Why This Criterion Matters
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {inspectedCriterion.criterion.importanceExplanation}
              </p>
            </div>

            {/* Actionable Next Step Recommendation */}
            {inspectedCriterion.criterion.recommendation && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400" /> Actionable Next Steps For Decision-Makers
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {inspectedCriterion.criterion.recommendation}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectedCriterion(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
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
