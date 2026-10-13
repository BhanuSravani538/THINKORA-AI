import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { EvidenceExplorerPage } from './pages/EvidenceExplorerPage';
import { DecisionSimulatorPage } from './pages/DecisionSimulatorPage';
import { EvidenceGraphPage } from './pages/EvidenceGraphPage';
import { ReportsPage } from './pages/ReportsPage';
import { CreateWorkspaceModal } from './components/common/CreateWorkspaceModal';
import { UploadDocumentModal } from './components/common/UploadDocumentModal';

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = (file: File | null, error?: string | null) => {
    setSelectedFile(file);
    setFileError(error || null);
    setUploadDocOpen(true);
  };

  const handleOpenUploadModalDirectly = () => {
    setSelectedFile(null);
    setFileError(null);
    setUploadDocOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Navbar */}
      <Navbar
        onOpenCreateWorkspace={() => setCreateWorkspaceOpen(true)}
        onOpenUploadDoc={handleOpenUploadModalDirectly}
        onFileSelect={handleFileSelect}
      />

      {/* Main Body Area: Sidebar + Scrollable Content View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto bg-slate-950/40 relative">
          <Routes>
            <Route
              path="/"
              element={
                <OverviewPage
                  onOpenCreateWorkspace={() => setCreateWorkspaceOpen(true)}
                  onOpenUploadDoc={handleOpenUploadModalDirectly}
                />
              }
            />
            <Route
              path="/workspaces"
              element={
                <WorkspacesPage
                  onOpenCreateWorkspace={() => setCreateWorkspaceOpen(true)}
                />
              }
            />
            <Route
              path="/documents"
              element={
                <DocumentsPage
                  onOpenUploadDoc={handleOpenUploadModalDirectly}
                  onFileSelect={handleFileSelect}
                />
              }
            />
            <Route path="/evidence" element={<EvidenceExplorerPage />} />
            <Route path="/simulator" element={<DecisionSimulatorPage />} />
            <Route path="/graph" element={<EvidenceGraphPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      <CreateWorkspaceModal
        isOpen={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
      />
      <UploadDocumentModal
        isOpen={uploadDocOpen}
        onClose={() => {
          setUploadDocOpen(false);
          setSelectedFile(null);
          setFileError(null);
        }}
        initialFile={selectedFile}
        initialError={fileError}
      />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <AppContent />
      </WorkspaceProvider>
    </BrowserRouter>
  );
}

export default App;
