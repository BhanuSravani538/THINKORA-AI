import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import {
  HypothesisNode,
  ClaimNode,
  SourceNode,
  ContradictionNode,
  OptionNode,
} from '../components/graph/CustomNodes';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Network,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { GraphNodeData } from '../types';


const nodeTypes = {
  hypothesis: HypothesisNode,
  claim: ClaimNode,
  source: SourceNode,
  contradiction: ContradictionNode,
  option: OptionNode,
};

const INITIAL_GRAPH_NODES: Node[] = [
  // Top Hypothesis
  {
    id: 'hyp-root',
    type: 'hypothesis',
    position: { x: 500, y: 30 },
    data: {
      id: 'hyp-root',
      label: 'Optimal Architecture for 85M Daily Events',
      type: 'hypothesis',
      subtitle: 'SLA < 25ms p99, Budget cap $140k/mo, SOC2/HIPAA strictness',
    },
  },

  // Decision Options
  {
    id: 'opt-serverless',
    type: 'option',
    position: { x: 120, y: 190 },
    data: {
      id: 'opt-serverless',
      label: 'Multi-Region Serverless Native',
      type: 'option',
      subtitle: 'Fastest delivery (4 mo), High egress OpEx ($172k)',
      score: 2,
    },
  },
  {
    id: 'opt-hybrid-k8s',
    type: 'option',
    position: { x: 500, y: 190 },
    data: {
      id: 'opt-hybrid-k8s',
      label: 'Hybrid Kubernetes Fabric',
      type: 'option',
      subtitle: 'Predictable 14ms p99, $98.5k/mo TCO, Winner',
      score: 1,
    },
  },
  {
    id: 'opt-openstack',
    type: 'option',
    position: { x: 880, y: 190 },
    data: {
      id: 'opt-openstack',
      label: 'Private Sovereign Colocation',
      type: 'option',
      subtitle: 'Air-gapped security, 14 mo lead time, $142k/mo',
      score: 3,
    },
  },

  // Sources
  {
    id: 'src-gartner',
    type: 'source',
    position: { x: 40, y: 380 },
    data: {
      id: 'src-gartner',
      label: 'Gartner Cloud TCO 2025',
      type: 'source',
      subtitle: '42 pages • Gartner Cloud Practice',
    },
  },
  {
    id: 'src-csail',
    type: 'source',
    position: { x: 400, y: 380 },
    data: {
      id: 'src-csail',
      label: 'MIT CSAIL Latency Audit',
      type: 'source',
      subtitle: '28 pages • Distributed Systems Lab',
    },
  },
  {
    id: 'src-finops',
    type: 'source',
    position: { x: 680, y: 380 },
    data: {
      id: 'src-finops',
      label: 'Internal FinOps FY25 Audit',
      type: 'source',
      subtitle: '12 pages • Corporate Finance',
    },
  },
  {
    id: 'src-nis2',
    type: 'source',
    position: { x: 960, y: 380 },
    data: {
      id: 'src-nis2',
      label: 'EU NIS2 Sovereign Directive',
      type: 'source',
      subtitle: '22 pages • ENISA Agency',
    },
  },

  // Claims
  {
    id: 'clm-egress',
    type: 'claim',
    position: { x: 30, y: 550 },
    data: {
      id: 'clm-egress',
      label: 'Serverless incurs 3.8x higher egress at >45k QPS',
      type: 'claim',
      confidence: 94,
      docTitle: 'Gartner Cloud TCO 2025',
    },
  },
  {
    id: 'clm-tail-latency',
    type: 'claim',
    position: { x: 340, y: 550 },
    data: {
      id: 'clm-tail-latency',
      label: 'Bare-metal achieves 12.8ms to 14.4ms deterministic p99',
      type: 'claim',
      confidence: 96,
      docTitle: 'MIT CSAIL Latency Audit',
    },
  },
  {
    id: 'clm-savings',
    type: 'claim',
    position: { x: 660, y: 550 },
    data: {
      id: 'clm-savings',
      label: 'Hybrid leasing yields $882,000 net annual savings',
      type: 'claim',
      confidence: 96,
      docTitle: 'Internal FinOps FY25 Audit',
    },
  },
  {
    id: 'clm-airgap',
    type: 'claim',
    position: { x: 970, y: 550 },
    data: {
      id: 'clm-airgap',
      label: 'On-prem is sole architecture fully exempt from CLOUD Act',
      type: 'claim',
      confidence: 99,
      docTitle: 'EU NIS2 Directive',
    },
  },

  // Contradiction Nodes
  {
    id: 'con-latency-sla',
    type: 'contradiction',
    position: { x: 190, y: 720 },
    data: {
      id: 'con-latency-sla',
      label: 'Tail Latency SLA Discrepancy',
      type: 'contradiction',
      subtitle: 'Vendor claims <10ms vs MIT CSAIL measured 214ms spike',
      severity: 'critical',
    },
  },
  {
    id: 'con-lead-time',
    type: 'contradiction',
    position: { x: 820, y: 720 },
    data: {
      id: 'con-lead-time',
      label: 'Hardware Procurement Backlog',
      type: 'contradiction',
      subtitle: 'Vendor 12-wk quote vs Gartner 34-wk documented backlog',
      severity: 'critical',
    },
  },
];

const INITIAL_GRAPH_EDGES: Edge[] = [
  // Hypothesis to Options
  {
    id: 'e-hyp-opt1',
    source: 'hyp-root',
    target: 'opt-serverless',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    label: 'Evaluates',
  },
  {
    id: 'e-hyp-opt2',
    source: 'hyp-root',
    target: 'opt-hybrid-k8s',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 3 },
    label: 'Evaluates',
  },
  {
    id: 'e-hyp-opt3',
    source: 'hyp-root',
    target: 'opt-openstack',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    label: 'Evaluates',
  },

  // Options to Sources
  {
    id: 'e-opt1-src1',
    source: 'opt-serverless',
    target: 'src-gartner',
    style: { stroke: '#06b6d4', strokeWidth: 1.5 },
  },
  {
    id: 'e-opt2-src2',
    source: 'opt-hybrid-k8s',
    target: 'src-csail',
    style: { stroke: '#06b6d4', strokeWidth: 1.5 },
  },
  {
    id: 'e-opt2-src3',
    source: 'opt-hybrid-k8s',
    target: 'src-finops',
    style: { stroke: '#06b6d4', strokeWidth: 1.5 },
  },
  {
    id: 'e-opt3-src4',
    source: 'opt-openstack',
    target: 'src-nis2',
    style: { stroke: '#06b6d4', strokeWidth: 1.5 },
  },

  // Sources to Claims
  {
    id: 'e-src1-clm1',
    source: 'src-gartner',
    target: 'clm-egress',
    style: { stroke: '#10b981', strokeWidth: 1.5 },
  },
  {
    id: 'e-src2-clm2',
    source: 'src-csail',
    target: 'clm-tail-latency',
    style: { stroke: '#10b981', strokeWidth: 2 },
  },
  {
    id: 'e-src3-clm3',
    source: 'src-finops',
    target: 'clm-savings',
    style: { stroke: '#10b981', strokeWidth: 2 },
  },
  {
    id: 'e-src4-clm4',
    source: 'src-nis2',
    target: 'clm-airgap',
    style: { stroke: '#10b981', strokeWidth: 2 },
  },

  // Claims to Contradictions
  {
    id: 'e-clm1-con1',
    source: 'clm-egress',
    target: 'con-latency-sla',
    style: { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '4,4' },
    label: 'Conflicts',
  },
  {
    id: 'e-clm4-con2',
    source: 'clm-airgap',
    target: 'con-lead-time',
    style: { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '4,4' },
    label: 'Conflicts',
  },
];

export const EvidenceGraphPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_GRAPH_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_GRAPH_EDGES);

  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as unknown as GraphNodeData);
  }, []);

  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const nodeData = n.data as unknown as GraphNodeData;
      const matchesType =
        filterType === 'all' ||
        nodeData.type === filterType ||
        (filterType === 'contradiction' && nodeData.type === 'contradiction');

      const matchesSearch =
        !searchQuery ||
        nodeData.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (nodeData.subtitle && nodeData.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesType && matchesSearch;
    });
  }, [nodes, filterType, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-slate-950">
      {/* Top Header / Filter Bar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Interactive React Flow
            </span>
            <span className="text-xs text-slate-400">{activeWorkspace.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Network className="w-5 h-5 text-blue-400" /> Evidence Knowledge Graph Canvas
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'hypothesis', 'option', 'source', 'claim', 'contradiction'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                  filterType === t
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'all' ? 'All' : t === 'contradiction' ? 'Conflicts' : t}
              </button>
            ))}
          </div>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search graph..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Canvas + Inspector Split */}
      <div className="flex-1 relative flex">
        {/* React Flow Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            colorMode="dark"
            className="bg-slate-950"
            minZoom={0.2}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1E293B" />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300" />
            <MiniMap
              nodeColor={node => {
                const type = (node.data as unknown as GraphNodeData)?.type;
                switch (type) {
                  case 'hypothesis':
                    return '#6366f1';
                  case 'claim':
                    return '#10b981';
                  case 'source':
                    return '#06b6d4';
                  case 'contradiction':
                    return '#f43f5e';
                  case 'option':
                    return '#3b82f6';
                  default:
                    return '#64748b';
                }
              }}
              maskColor="rgba(11, 15, 25, 0.8)"
              className="!border-slate-800"
            />

            {/* Quick Legend Panel */}
            <Panel position="bottom-left" className="m-4">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-1.5 text-[11px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Graph Node Legend
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-300">Hypotheses & Goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-300">Decision Candidate Options</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-300">Ingested Sources / Whitepapers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Empirical Claims</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-rose-400 font-semibold">Contradictions / Conflicts</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <div className="w-80 sm:w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md p-5 overflow-y-auto space-y-4 shadow-2xl z-30 animate-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  Node Inspector
                </span>
                <span className="text-[11px] font-semibold text-slate-400 capitalize">
                  Type: {selectedNode.type}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white leading-snug">{selectedNode.label}</h3>
              {selectedNode.subtitle && (
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  {selectedNode.subtitle}
                </p>
              )}
            </div>

            {selectedNode.confidence && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
                <span className="text-emerald-300 font-semibold">Empirical Confidence</span>
                <span className="text-base font-bold text-emerald-400">{selectedNode.confidence}%</span>
              </div>
            )}

            {selectedNode.severity && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs space-y-1">
                <div className="text-rose-300 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Severity: {selectedNode.severity.toUpperCase()}
                </div>
                <p className="text-[11px] text-rose-200/80">
                  Flagged by conflict triangulation engine across multiple independent sources.
                </p>
              </div>
            )}

            {selectedNode.docTitle && (
              <div className="text-xs space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Document Origin</span>
                <p className="font-semibold text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {selectedNode.docTitle}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
