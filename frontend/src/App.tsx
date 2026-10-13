import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { EvidenceExplorerPage } from './pages/EvidenceExplorerPage';
import { DecisionSimulatorPage } from './pages/DecisionSimulatorPage';
import { EvidenceGraphPage } from './pages/EvidenceGraphPage';
import { ReportsPage } from './pages/ReportsPage';
import { CreateWorkspaceModal } from './components/common/CreateWorkspaceModal';
import { UploadDocumentModal } from './components/common/UploadDocumentModal';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-mono tracking-wider text-slate-400">
          INITIALIZING THINKORA INTELLIGENCE...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

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
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <WorkspaceProvider>
                  <AppContent />
                </WorkspaceProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

