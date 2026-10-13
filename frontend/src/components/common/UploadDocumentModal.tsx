import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  UploadCloud,
  FileText,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  X,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import type { DocumentItem } from '../../types';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile?: File | null;
  initialError?: string | null;
}

const PRESET_SAMPLE_DOCS = [
  {
    title: 'IDC Cloud Native Enterprise Migration & TCO Survey 2026',
    fileName: 'IDC_Cloud_Native_Enterprise_Survey_2026.pdf',
    fileSize: '3.4 MB',
    fileType: 'pdf' as const,
    author: 'IDC Infrastructure Practice',
    summary: 'Empirical benchmark analyzing 250 enterprise Kubernetes transitions with cost metrics across networking, storage, and operational toil.',
    tags: ['IDC', 'Kubernetes', 'TCO', 'Enterprise'],
    pages: 36,
  },
  {
    title: 'ISO/IEC 27001:2022 & Sovereign Cryptographic Assurance Report',
    fileName: 'ISO_27001_Sovereign_Crypto_Audit.pdf',
    fileSize: '5.1 MB',
    fileType: 'pdf' as const,
    author: 'BSI Compliance Certification Authority',
    summary: 'Independent security audit validating tenant hardware isolation, zero data leakage guarantees, and HSM key boundary compliance.',
    tags: ['ISO 27001', 'Security', 'HSM', 'Compliance'],
    pages: 58,
  },
  {
    title: 'High-Density Rack Power & Liquid Cooling Engineering Feasibility',
    fileName: 'DataCenter_40kW_Rack_Cooling_Assessment.xlsx',
    fileSize: '2.8 MB',
    fileType: 'xlsx' as const,
    author: 'Equinix Facility Engineering Services',
    summary: 'Direct thermodynamic modeling and electrical feeder capacity for 40kW per rack high-density compute installations.',
    tags: ['Facility', 'CapEx', 'Power', 'Datacenter'],
    pages: 14,
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  initialFile = null,
  initialError = null,
}) => {
  const { activeWorkspace, addDocument, uploadPdfDocument } = useWorkspace();

  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(initialFile ? null : 0);
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customSummary, setCustomSummary] = useState('');

  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(initialError);
  const [backendError, setBackendError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [createdDocument, setCreatedDocument] = useState<DocumentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when initialFile or initialError changes
  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
      setSelectedPresetIndex(null);
      const cleanName = initialFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setCustomTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      setCustomAuthor('Research Engineering Group');
      setCustomSummary(`Empirical whitepaper ingested from ${initialFile.name} (${formatBytes(initialFile.size)}).`);
    } else {
      setSelectedFile(null);
      if (!selectedPresetIndex && selectedPresetIndex !== 0) {
        setSelectedPresetIndex(0);
      }
    }
    setValidationError(initialError || null);
    setBackendError(null);
    setUploadSuccess(false);
    setIsUploading(false);
    setUploadProgress(0);
  }, [initialFile, initialError, isOpen]);

  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    setBackendError(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      const ext = file.name.split('.').pop() || 'unknown';
      setValidationError(`Unsupported file type (.${ext}). Only PDF documents (.pdf) are supported for automated evidence extraction.`);
      setSelectedFile(null);
      return false;
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setValidationError(`File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 50 MB.`);
      setSelectedFile(null);
      return false;
    }

    setSelectedFile(file);
    setSelectedPresetIndex(null);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setCustomTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    setCustomAuthor('Internal Architecture Committee');
    setCustomSummary(`Empirical evidence benchmark ingested from ${file.name} (${formatBytes(file.size)}).`);
    return true;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      // User cancelled picker dialog
      return;
    }
    const file = files[0];
    e.target.value = '';
    validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setSelectedPresetIndex(0);
    setValidationError(null);
    setBackendError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

    setValidationError(null);
    setBackendError(null);

    // Flow 1: Upload native custom PDF file to backend
    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(15);
      setProgressStage('Uploading PDF binary to THINKORA research intelligence engine...');

      const timer1 = setTimeout(() => {
        setUploadProgress(45);
        setProgressStage('Performing layout OCR & factual claim extraction...');
      }, 400);

      const timer2 = setTimeout(() => {
        setUploadProgress(78);
        setProgressStage('Triangulating claims against knowledge matrix...');
      }, 900);

      try {
        const doc = await uploadPdfDocument(selectedFile, {
          title: customTitle || selectedFile.name,
          author: customAuthor || 'Architecture Committee',
          summary: customSummary || `Parsed empirical findings from ${selectedFile.name}.`,
        });

        clearTimeout(timer1);
        clearTimeout(timer2);
        setUploadProgress(100);
        setProgressStage('Evidence triangulation verified!');
        setCreatedDocument(doc);
        setIsUploading(false);
        setUploadSuccess(true);
      } catch (err: any) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        setIsUploading(false);
        setBackendError(err.message || 'Failed to upload and parse document on server.');
      }
      return;
    }

    // Flow 2: Ingest synthetic benchmark preset (for instant demo scenarios)
    if (selectedPresetIndex !== null) {
      setIsUploading(true);
      setUploadProgress(40);
      setProgressStage('Simulating benchmark document triangulation...');

      const preset = PRESET_SAMPLE_DOCS[selectedPresetIndex];
      const docPayload = {
        workspaceId: activeWorkspace.id,
        title: preset.title,
        fileName: preset.fileName,
        fileSize: preset.fileSize,
        fileType: preset.fileType,
        author: preset.author,
        summary: preset.summary,
        tags: preset.tags,
        pages: preset.pages,
      };

      try {
        const doc = await addDocument(docPayload);
        setUploadProgress(100);
        setProgressStage('Ingestion complete!');
        setCreatedDocument(doc);
        setIsUploading(false);
        setUploadSuccess(true);
      } catch (err: any) {
        setIsUploading(false);
        setBackendError(err.message || 'Failed to ingest preset document.');
      }
      return;
    }

    // No file or preset selected
    setValidationError('Please select or upload a valid PDF document before starting ingestion.');
  };

  const handleCloseModal = () => {
    if (isUploading) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Ingest Evidence Document"
      subtitle={`Target Workspace: ${activeWorkspace.name}`}
      maxWidth="2xl"
    >
      {/* Hidden native file input element */}
      <input
        ref={fileInputRef}
        id="modal-pdf-file-input"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label="Upload PDF Evidence Document"
        tabIndex={-1}
        onChange={handleFileInputChange}
      />

      {uploadSuccess ? (
        <div className="py-8 text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white tracking-tight">Evidence Document Ingested!</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Automated triangulation pipeline extracted claims, cross-referenced contradictions, and synthesized knowledge graph nodes.
            </p>
          </div>

          {createdDocument && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white truncate">{createdDocument.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  {createdDocument.fileSize}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">{createdDocument.summary}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                <span>Extracted: {createdDocument.extractedClaimsCount || 8} claims</span>
                <span className="text-emerald-400 font-semibold">Ready for Decision Simulation</span>
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <span>View in Document Repository</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-5">
          {/* Validation & Server Error Banners */}
          {validationError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-rose-200">Validation Notice: </span>
                <span>{validationError}</span>
              </div>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-rose-400 hover:text-white text-xs shrink-0"
              >
                ×
              </button>
            </div>
          )}

          {backendError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-amber-200">Backend Response: </span>
                <span>{backendError}</span>
              </div>
              <button
                type="button"
                onClick={() => setBackendError(null)}
                className="text-amber-400 hover:text-white text-xs shrink-0"
              >
                ×
              </button>
            </div>
          )}

          {/* Section 1: Drag & Drop or Native PDF Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-blue-400" /> Evidence PDF File Selection
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Max 50MB • PDF</span>
            </div>

            {selectedFile ? (
              /* Selected file summary card */
              <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/40 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{selectedFile.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-blue-300">{formatBytes(selectedFile.size)}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid PDF
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                      title="Choose a different PDF file"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      disabled={isUploading}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata inputs for custom file */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Evidence Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      disabled={isUploading}
                      placeholder="e.g. Multi-Region Serverless Networking Benchmark"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Author / Organization</label>
                      <input
                        type="text"
                        value={customAuthor}
                        onChange={e => setCustomAuthor(e.target.value)}
                        disabled={isUploading}
                        placeholder="e.g. Cloud Architecture Lab"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Key Context / Summary</label>
                      <input
                        type="text"
                        value={customSummary}
                        onChange={e => setCustomSummary(e.target.value)}
                        disabled={isUploading}
                        placeholder="Brief summary of findings"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Drag & Drop Zone */
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload PDF Evidence File - Click or Drag and Drop"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-600/15 shadow-lg shadow-blue-500/10'
                    : 'border-slate-800 hover:border-blue-500/60 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-200">
                  <span className="text-blue-400 font-semibold underline underline-offset-2">Click to browse</span> or drag and drop your research PDF
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Accepts application/pdf up to 50MB</p>
              </div>
            )}
          </div>

          {/* Section 2: Preset synthetic documents (alternative option) */}
          {!selectedFile && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Or Ingest Ready Synthetic Benchmark:
                </label>
                <span className="text-[11px] text-blue-400 font-medium">Quick Demo Preset</span>
              </div>

              <div className="space-y-2">
                {PRESET_SAMPLE_DOCS.map((doc, idx) => {
                  const isSelected = selectedPresetIndex === idx;
                  return (
                    <div
                      key={doc.title}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => {
                        setSelectedPresetIndex(idx);
                        setSelectedFile(null);
                        setValidationError(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPresetIndex(idx);
                          setSelectedFile(null);
                        }
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                          <span className="text-xs font-semibold text-slate-200 truncate">{doc.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{doc.fileSize}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 pl-6">{doc.summary}</p>
                      <div className="flex items-center gap-2 mt-2 pl-6">
                        <span className="text-[10px] text-slate-500">{doc.author}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] text-slate-500">{doc.pages} pages</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ingestion Pipeline Stages preview */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Automated Ingestion & Triangulation Pipeline
              </span>
              {isUploading && (
                <span className="text-[10px] text-blue-400 font-mono font-medium animate-pulse">
                  {uploadProgress}% • {progressStage}
                </span>
              )}
            </div>

            {/* Progress bar when uploading */}
            {isUploading && (
              <div className="w-full bg-slate-900 rounded-full h-1.5 mb-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isUploading ? 'bg-blue-400 animate-pulse' : 'bg-blue-400'}`} />
                <span>1. Layout & OCR</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>2. Entity Claims</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>3. Triangulation</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>4. Conflict Check</span>
              </div>
            </div>
          </div>

          {/* Form action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="start-ingestion-button"
              type="submit"
              disabled={isUploading || (!selectedFile && selectedPresetIndex === null)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isUploading ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Ingestion...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Start Ingestion</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
