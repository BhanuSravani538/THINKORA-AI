import React, { useState } from 'react';
import { Modal } from './Modal';
import { useWorkspace } from '../../context/WorkspaceContext';
import { FolderPlus, Tag, Target, User, ShieldAlert } from 'lucide-react';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('Enterprise Infrastructure');
  const [description, setDescription] = useState('');
  const [decisionGoal, setDecisionGoal] = useState('');
  const [owner, setOwner] = useState('Dr. Elena Rostova');
  const [tagsInput, setTagsInput] = useState('Production, Architecture, High-Availability');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    createWorkspace({
      name,
      domain,
      description: description || 'Evidence synthesis research for architectural decision support.',
      decisionGoal: decisionGoal || 'Establish trade-off envelope and empirical verification matrix.',
      owner: owner || 'Engineering Lead',
      tags: tags.length > 0 ? tags : ['Active-Research'],
      status: 'active',
    });

    setName('');
    setDescription('');
    setDecisionGoal('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Research Workspace"
      subtitle="Establish a new evidence-gathering and decision-support project."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Workspace Title *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. LLM Inference Engine: vLLM vs TensorRT-LLM"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Domain / Category
            </label>
            <select
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Enterprise Infrastructure">Enterprise Infrastructure</option>
              <option value="Clean Energy & Utilities">Clean Energy & Utilities</option>
              <option value="Healthcare & Regulatory">Healthcare & Regulatory</option>
              <option value="Autonomous Systems">Autonomous Systems</option>
              <option value="Cybersecurity & Defense">Cybersecurity & Defense</option>
              <option value="FinOps & Procurement">FinOps & Procurement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-400" /> Research Lead / Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              placeholder="Lead Investigator"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-emerald-400" /> Core Decision Goal
          </label>
          <input
            type="text"
            value={decisionGoal}
            onChange={e => setDecisionGoal(e.target.value)}
            placeholder="e.g. Select optimal inference serving platform achieving <30ms TTFT under $40k/mo budget cap."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Scope & Background Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Synthesize empirical test data, benchmarks, and architectural constraints..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-cyan-400" /> Comma-separated Tags
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="FinOps, p99-Latency, SOC2, High-Availability"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            Create Workspace
          </button>
        </div>
      </form>
    </Modal>
  );
};
