import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Sparkles,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { GraphNodeData } from '../../types';

export const HypothesisNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as GraphNodeData;
  return (
    <div className="relative px-4 py-3 rounded-2xl bg-slate-900 border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/20 text-white min-w-[240px] max-w-[280px]">
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-2.5 !h-2.5" />
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Hypothesis / Goal</span>
      </div>
      <div className="text-xs font-bold leading-snug">{nodeData.label}</div>
      {nodeData.subtitle && (
        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{nodeData.subtitle}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2.5 !h-2.5" />
    </div>
  );
});

export const ClaimNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as GraphNodeData;
  return (
    <div className="relative px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-500/80 shadow-lg shadow-emerald-500/10 text-white min-w-[220px] max-w-[260px] transition-all">
      <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-2 !h-2" />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Empirical Claim
        </span>
        {nodeData.confidence && (
          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
            {nodeData.confidence}%
          </span>
        )}
      </div>
      <div className="text-xs font-semibold text-slate-200 line-clamp-2">{nodeData.label}</div>
      {nodeData.docTitle && (
        <div className="text-[9px] text-slate-400 mt-1 truncate">Source: {nodeData.docTitle}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400 !w-2 !h-2" />
    </div>
  );
});

export const SourceNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as GraphNodeData;
  return (
    <div className="relative px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-500/80 shadow-lg shadow-cyan-500/10 text-white min-w-[200px] max-w-[250px] transition-all">
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2 !h-2" />
      <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
        <FileText className="w-3 h-3" /> Verified Document
      </div>
      <div className="text-xs font-bold text-slate-200 line-clamp-1">{nodeData.label}</div>
      {nodeData.subtitle && (
        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{nodeData.subtitle}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2 !h-2" />
    </div>
  );
});

export const ContradictionNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as GraphNodeData;
  return (
    <div className="relative px-3.5 py-2.5 rounded-xl bg-rose-950/80 border-2 border-rose-500 shadow-xl shadow-rose-500/20 text-white min-w-[230px] max-w-[270px] animate-pulse">
      <Handle type="target" position={Position.Top} className="!bg-rose-400 !w-2.5 !h-2.5" />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Contradiction Detected
        </span>
        <span className="text-[9px] font-bold bg-rose-500 text-white px-1.5 py-0.2 rounded uppercase">
          {nodeData.severity || 'Critical'}
        </span>
      </div>
      <div className="text-xs font-bold text-white line-clamp-2">{nodeData.label}</div>
      {nodeData.subtitle && (
        <div className="text-[10px] text-rose-200/80 mt-1 line-clamp-2">{nodeData.subtitle}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-rose-400 !w-2.5 !h-2.5" />
    </div>
  );
});

export const OptionNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as GraphNodeData;
  return (
    <div className="relative px-4 py-3 rounded-2xl bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/20 text-white min-w-[240px] max-w-[280px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2.5 !h-2.5" />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5" /> Candidate Option
        </span>
        <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
          Rank #{nodeData.score || '1'}
        </span>
      </div>
      <div className="text-xs font-bold text-white leading-snug">{nodeData.label}</div>
      {nodeData.subtitle && (
        <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{nodeData.subtitle}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2.5 !h-2.5" />
    </div>
  );
});
