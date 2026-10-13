import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  FileText,
  UploadCloud,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  FileSpreadsheet,
  Eye,
  Sparkles,
  X,
} from 'lucide-react';
import type { DocumentItem } from '../types';

interface DocumentsPageProps {
  onOpenUploadDoc?: () => void;
  onFileSelect?: (file: File | null, error?: string | null) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onOpenUploadDoc, onFileSelect }) => {
  const { documents, deleteDocument } = useWorkspace();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFilePicked = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      onFileSelect?.(null, `Unsupported file format "${file.name.split('.').pop()}". Only PDF documents (.pdf) are supported.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      onFileSelect?.(null, `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 50MB limit.`);
      return;
    }
    onFileSelect?.(file, null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = '';
    handleFilePicked(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilePicked(files[0]);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const filteredDocs = documents.filter(
    d =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-400" />;
      default:
        return <FileText className="w-5 h-5 text-rose-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-400" /> Evidence Document Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ingested benchmark papers, vendor contracts, financial models, and cyber attestations.
          </p>
        </div>
        <input
          ref={fileInputRef}
          id="documents-page-file-input"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-label="Upload PDF Evidence Document"
          tabIndex={-1}
          onChange={handleInputChange}
        />
        <button
          id="documents-page-upload-btn"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Upload Drop Zone Banner with full Drag & Drop and Keyboard Accessibility */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Ingest New Evidence Document - Click or Drag and Drop PDF"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={e => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center group focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
          isDragOver
            ? 'border-blue-400 bg-blue-600/15 shadow-lg shadow-blue-500/10'
            : 'border-slate-800 hover:border-blue-500/60 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white">Ingest New Evidence Document</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
          Drag and drop PDF benchmarks, whitepapers, SLA contracts, or FinOps models to automatically extract claims, uncover contradictions, and expand the graph.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[11px] text-slate-500">
          <span>✓ Multi-format OCR</span>
          <span>✓ Automated Claim Triangulation</span>
          <span>✓ Conflict & Bias Detection</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, author, or keyword..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{filteredDocs.length}</span> documents
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => {
          const isProcessing = doc.status === 'extracting';

          return (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                    {getDocIcon(doc.fileType)}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isProcessing ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3" /> Parsing...
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Processed
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.fileName}</p>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {doc.summary}
                </p>

                {/* Pipeline stages badges */}
                <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-slate-950/70 border border-slate-800/60 text-[9px] text-slate-400">
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 uppercase">OCR</div>
                    <span className={doc.pipelineSteps.ocr === 'done' ? 'text-emerald-400 font-bold' : 'text-blue-400 animate-pulse'}>
                      {doc.pipelineSteps.ocr === 'done' ? '✓' : '...'}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 uppercase">Entities</div>
                    <span className={doc.pipelineSteps.entityExtraction === 'done' ? 'text-emerald-400 font-bold' : 'text-blue-400 animate-pulse'}>
                      {doc.pipelineSteps.entityExtraction === 'done' ? '✓' : '...'}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 uppercase">Claims</div>
                    <span className={doc.pipelineSteps.claimTriangulation === 'done' ? 'text-emerald-400 font-bold' : 'text-blue-400 animate-pulse'}>
                      {doc.pipelineSteps.claimTriangulation === 'done' ? '✓' : '...'}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 uppercase">Conflicts</div>
                    <span className={doc.pipelineSteps.conflictCheck === 'done' ? 'text-emerald-400 font-bold' : 'text-blue-400 animate-pulse'}>
                      {doc.pipelineSteps.conflictCheck === 'done' ? '✓' : '...'}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-white">{doc.extractedClaimsCount}</span> claims •{' '}
                  <span className={doc.contradictionsCount > 0 ? 'text-amber-400 font-semibold' : ''}>
                    {doc.contradictionsCount} conflicts
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-[11px] font-medium"
                    title="Inspect Extracted Claims"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Claims</span>
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Inspector Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  Document Claims & Source Lineage
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedDoc.title}</h3>
                <p className="text-xs text-slate-400">{selectedDoc.author} • {selectedDoc.pages} pages • {selectedDoc.fileSize}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Executive Summary</h4>
              <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800 leading-relaxed">
                {selectedDoc.summary}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Extracted Empirical Claims & Citations
                </h4>
                <span className="text-[11px] text-slate-400">
                  {selectedDoc.claims?.length || selectedDoc.extractedClaimsCount} claims detected
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedDoc.claims && selectedDoc.claims.length > 0 ? (
                  selectedDoc.claims.map(claim => (
                    <div
                      key={claim.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{claim.statement}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            claim.status === 'verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {claim.status === 'verified' ? 'Verified (94%)' : 'Conflicted'}
                        </span>
                      </div>
                      <blockquote className="border-l-2 border-blue-500/50 pl-3 py-1 italic text-slate-400 text-[11px] bg-slate-900/40 rounded-r">
                        "{claim.quote}"
                      </blockquote>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>Evidence Type: <span className="text-slate-300 capitalize">{claim.evidenceType.replace('_', ' ')}</span></span>
                        <span>Extracted: {claim.extractedDate}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                    Automated triangulation extracted {selectedDoc.extractedClaimsCount} evidence tokens integrated into the Evidence Matrix.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
