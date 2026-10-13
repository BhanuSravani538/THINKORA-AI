import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  ResearchWorkspace,
  DocumentItem,
  DecisionOption,
  SimulationConstraints,
  ScenarioPreset,
  ActivityItem,
  OptionSimulationResult,
} from '../types';
import {
  INITIAL_WORKSPACES,
  MOCK_DOCUMENTS,
  MOCK_DECISION_OPTIONS,
  DEFAULT_CONSTRAINTS,
  SCENARIO_PRESETS,
  SOLAR_SCENARIO_PRESETS,
  MOCK_ACTIVITIES,
} from '../data/mockData';
import { evaluateAllOptions } from '../utils/decisionEngine';
import { extractOptionsFromDocument } from '../utils/documentOptionExtractor';
import { api } from '../services/api';

interface WorkspaceContextType {
  workspaces: ResearchWorkspace[];
  activeWorkspaceId: string;
  activeWorkspace: ResearchWorkspace;
  setActiveWorkspaceId: (id: string) => void;
  createWorkspace: (workspace: Omit<ResearchWorkspace, 'id' | 'createdAt' | 'lastActive' | 'documentsCount' | 'claimsCount' | 'contradictionsCount' | 'completionPercentage' | 'confidenceGrade'>) => Promise<ResearchWorkspace> | void;

  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadDate' | 'status' | 'pipelineSteps' | 'extractedClaimsCount' | 'contradictionsCount'>) => Promise<DocumentItem>;
  uploadPdfDocument: (file: File, meta?: { title?: string; author?: string; summary?: string }) => Promise<DocumentItem>;
  deleteDocument: (docId: string) => void;

  options: DecisionOption[];
  constraints: SimulationConstraints;
  setConstraints: React.Dispatch<React.SetStateAction<SimulationConstraints>>;
  updateConstraint: <K extends keyof SimulationConstraints>(key: K, value: SimulationConstraints[K]) => void;
  updatePriorityWeight: (key: keyof SimulationConstraints['priorityWeights'], value: number) => void;

  isSolarWorkspace: boolean;
  availablePresets: ScenarioPreset[];
  activePresetId: string | null;
  applyPreset: (preset: ScenarioPreset) => void;
  resetConstraints: () => void;

  simulationResults: OptionSimulationResult[];
  baselineResults: OptionSimulationResult[];

  activities: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;

  selectedOptionId: string;
  setSelectedOptionId: (id: string) => void;

  // Search filter query across dashboard
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<ResearchWorkspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-solar-campus');
  const [documents, setDocuments] = useState<DocumentItem[]>(MOCK_DOCUMENTS);
  const [options, setOptions] = useState<DecisionOption[]>(MOCK_DECISION_OPTIONS);
  const [constraints, setConstraints] = useState<SimulationConstraints>(DEFAULT_CONSTRAINTS);
  const [activePresetId, setActivePresetId] = useState<string | null>('preset-solar-balanced');
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('opt-solar-a');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Synchronize available workspaces from backend on mount
  useEffect(() => {
    let isMounted = true;
    api.listWorkspaces()
      .then(remoteWorkspaces => {
        if (!isMounted || !remoteWorkspaces || remoteWorkspaces.length === 0) return;
        setWorkspaces(prev => {
          const remoteIds = new Set(remoteWorkspaces.map(w => w.id));
          const uniqueLocal = prev.filter(w => !remoteIds.has(w.id));
          return [...remoteWorkspaces, ...uniqueLocal];
        });
      })
      .catch(err => {
        console.warn('Backend workspaces sync skipped (offline or initial boot):', err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeWorkspace = useMemo(() => {
    return (
      workspaces.find(ws => ws.id === activeWorkspaceId) ||
      workspaces[0]
    );
  }, [workspaces, activeWorkspaceId]);

  // Dynamically load options belonging to active research workspace
  const currentWorkspaceOptions = useMemo(() => {
    const matched = options.filter(o => o.workspaceId === activeWorkspaceId);
    if (matched.length > 0) return matched;

    // Domain-based mapping: Clean Energy & Utilities -> Solar PV options
    const isSolar =
      activeWorkspace.domain === 'Clean Energy & Utilities' ||
      activeWorkspace.name.toLowerCase().includes('solar');

    if (isSolar) {
      return options.filter(o => o.domainCategory === 'solar_energy');
    }

    // Default to cloud infrastructure options
    return options.filter(o => o.domainCategory !== 'solar_energy');
  }, [options, activeWorkspaceId, activeWorkspace]);

  // Determine if active workspace operates in Solar / Clean Energy domain
  const isSolarWorkspace = useMemo(() => {
    return (
      currentWorkspaceOptions.some(o => o.domainCategory === 'solar_energy' || o.estimatedCost !== undefined) ||
      activeWorkspace.domain === 'Clean Energy & Utilities' ||
      activeWorkspace.name.toLowerCase().includes('solar')
    );
  }, [currentWorkspaceOptions, activeWorkspace]);

  // Active scenario presets based on domain
  const availablePresets = useMemo(() => {
    return isSolarWorkspace ? SOLAR_SCENARIO_PRESETS : SCENARIO_PRESETS;
  }, [isSolarWorkspace]);

  // Synchronize constraints and default model on workspace change
  useEffect(() => {
    if (isSolarWorkspace) {
      setConstraints(prev => ({
        ...prev,
        budgetLimit: 500000,
        availableRoofSpace: 1000,
        minDailyEnergyDemand: 75,
        currency: 'INR',
      }));
      setActivePresetId('preset-solar-balanced');
      setSelectedOptionId('opt-solar-a');
    } else {
      setConstraints(DEFAULT_CONSTRAINTS);
      setActivePresetId('preset-balanced');
      setSelectedOptionId('opt-hybrid-k8s');
    }
  }, [activeWorkspaceId, isSolarWorkspace]);

  // Real-time evaluation of all options under current dynamic constraints
  const simulationResults = useMemo(() => {
    return evaluateAllOptions(currentWorkspaceOptions, constraints);
  }, [currentWorkspaceOptions, constraints]);

  // Baseline evaluation for "What-If" delta comparisons
  const baselineResults = useMemo(() => {
    const baselineConstraints: SimulationConstraints = isSolarWorkspace
      ? {
          ...DEFAULT_CONSTRAINTS,
          budgetLimit: 500000,
          availableRoofSpace: 1000,
          minDailyEnergyDemand: 75,
          currency: 'INR',
        }
      : DEFAULT_CONSTRAINTS;
    return evaluateAllOptions(currentWorkspaceOptions, baselineConstraints);
  }, [currentWorkspaceOptions, isSolarWorkspace]);

  const updateConstraint = <K extends keyof SimulationConstraints>(key: K, value: SimulationConstraints[K]) => {
    setActivePresetId(null);
    setConstraints(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updatePriorityWeight = (key: keyof SimulationConstraints['priorityWeights'], value: number) => {
    setActivePresetId(null);
    setConstraints(prev => ({
      ...prev,
      priorityWeights: {
        ...prev.priorityWeights,
        [key]: value,
      },
    }));
  };

  const applyPreset = (preset: ScenarioPreset) => {
    setActivePresetId(preset.id);
    setConstraints(preset.constraints);

    addActivity({
      type: 'simulation_run',
      title: `Scenario applied: ${preset.name}`,
      description: `Evaluated ${currentWorkspaceOptions.length} candidates with custom parameter bounds.`,
      workspaceId: activeWorkspaceId,
      workspaceName: activeWorkspace.name,
      severity: 'info',
    });
  };

  const resetConstraints = () => {
    if (isSolarWorkspace) {
      setActivePresetId('preset-solar-balanced');
      setConstraints({
        budgetLimit: 140000,
        availableRoofSpace: 9000,
        minDailyEnergyDemand: 650,
        maxLatencyMs: 0,
        maxSpaceUnits: 0,
        requiredCompliance: 'standard',
        maxImplementationMonths: 12,
        maxComplexity: 'medium',
        priorityWeights: {
          cost: 4,
          performance: 5,
          compliance: 4,
          timeToValue: 3,
          risk: 4,
          spaceEfficiency: 4,
        },
      });
    } else {
      setActivePresetId('preset-balanced');
      setConstraints(DEFAULT_CONSTRAINTS);
    }
  };

  const addActivity = (item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newItem: ActivityItem = {
      ...item,
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
    };
    setActivities(prev => [newItem, ...prev.slice(0, 19)]);
  };

  const createWorkspace = async (
    data: Omit<
      ResearchWorkspace,
      | 'id'
      | 'createdAt'
      | 'lastActive'
      | 'documentsCount'
      | 'claimsCount'
      | 'contradictionsCount'
      | 'completionPercentage'
      | 'confidenceGrade'
    >
  ): Promise<ResearchWorkspace> => {
    const tempId = `ws-${Date.now()}`;
    const optimisticWs: ResearchWorkspace = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      completionPercentage: 10,
      confidenceGrade: 'B',
      documentsCount: 0,
      claimsCount: 0,
      contradictionsCount: 0,
    };

    try {
      const serverWs = await api.createWorkspace({
        name: data.name,
        domain: data.domain,
        description: data.description,
        decisionGoal: data.decisionGoal,
        status: data.status,
        tags: data.tags,
      });

      setWorkspaces(prev => {
        const filtered = prev.filter(w => w.id !== serverWs.id);
        return [serverWs, ...filtered];
      });
      setActiveWorkspaceId(serverWs.id);

      addActivity({
        type: 'matrix_updated',
        title: `Created workspace: ${serverWs.name}`,
        description: `New research workspace initialized under domain "${serverWs.domain}" and persisted to database.`,
        workspaceId: serverWs.id,
        workspaceName: serverWs.name,
        severity: 'success',
      });

      return serverWs;
    } catch (err: any) {
      console.warn('⚠️ Could not persist workspace to backend API, falling back to local state:', err?.message || err);
      setWorkspaces(prev => [optimisticWs, ...prev]);
      setActiveWorkspaceId(optimisticWs.id);

      addActivity({
        type: 'matrix_updated',
        title: `Created workspace: ${optimisticWs.name}`,
        description: `New research workspace initialized under domain "${optimisticWs.domain}" (offline mode).`,
        workspaceId: optimisticWs.id,
        workspaceName: optimisticWs.name,
        severity: 'info',
      });

      return optimisticWs;
    }
  };


  const addDocument = async (
    docData: Omit<
      DocumentItem,
      | 'id'
      | 'uploadDate'
      | 'status'
      | 'pipelineSteps'
      | 'extractedClaimsCount'
      | 'contradictionsCount'
    >
  ): Promise<DocumentItem> => {
    const docId = `doc-${Date.now()}`;
    const initialDoc: DocumentItem = {
      ...docData,
      id: docId,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'extracting',
      extractedClaimsCount: 0,
      contradictionsCount: 0,
      pipelineSteps: {
        ocr: 'running',
        entityExtraction: 'pending',
        claimTriangulation: 'pending',
        conflictCheck: 'pending',
      },
    };

    setDocuments(prev => [initialDoc, ...prev]);

    // Simulate multi-stage ingestion pipeline
    setTimeout(() => {
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? {
                ...d,
                pipelineSteps: {
                  ...d.pipelineSteps,
                  ocr: 'done',
                  entityExtraction: 'running',
                },
              }
            : d
        )
      );
    }, 1200);

    setTimeout(() => {
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? {
                ...d,
                pipelineSteps: {
                  ...d.pipelineSteps,
                  entityExtraction: 'done',
                  claimTriangulation: 'running',
                },
              }
            : d
        )
      );
    }, 2400);

    setTimeout(() => {
      const generatedClaims = 5 + Math.floor(Math.random() * 8);
      const generatedConflicts = Math.random() > 0.6 ? 1 : 0;

      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? {
                ...d,
                status: 'completed',
                extractedClaimsCount: generatedClaims,
                contradictionsCount: generatedConflicts,
                pipelineSteps: {
                  ocr: 'done',
                  entityExtraction: 'done',
                  claimTriangulation: 'done',
                  conflictCheck: 'done',
                },
              }
            : d
        )
      );

      // Update workspace stats
      setWorkspaces(prev =>
        prev.map(w =>
          w.id === activeWorkspaceId
            ? {
                ...w,
                documentsCount: w.documentsCount + 1,
                claimsCount: w.claimsCount + generatedClaims,
                contradictionsCount: w.contradictionsCount + generatedConflicts,
              }
            : w
        )
      );

      addActivity({
        type: 'doc_uploaded',
        title: `Ingestion completed: ${docData.title}`,
        description: `Extracted ${generatedClaims} factual claims and ${generatedConflicts} potential contradictions.`,
        workspaceId: activeWorkspaceId,
        workspaceName: activeWorkspace.name,
        severity: generatedConflicts > 0 ? 'warning' : 'success',
      });
    }, 3800);

    return initialDoc;
  };

  const uploadPdfDocument = async (
    file: File,
    meta?: { title?: string; author?: string; summary?: string }
  ): Promise<DocumentItem> => {
    const uploadedDoc = await api.uploadDocumentPdf(activeWorkspaceId, file, meta);

    // Merge into local state so dashboard updates dynamically
    setDocuments(prev => [uploadedDoc, ...prev.filter(d => d.id !== uploadedDoc.id)]);

    // Update workspace stats
    setWorkspaces(prev =>
      prev.map(w =>
        w.id === activeWorkspaceId
          ? {
              ...w,
              documentsCount: w.documentsCount + 1,
              claimsCount: w.claimsCount + (uploadedDoc.extractedClaimsCount || 8),
              contradictionsCount: w.contradictionsCount + (uploadedDoc.contradictionsCount || 0),
            }
          : w
      )
    );

    addActivity({
      type: 'doc_uploaded',
      title: `Ingested PDF: ${uploadedDoc.title}`,
      description: `Backend verified ${uploadedDoc.fileName} (${uploadedDoc.fileSize}) and extracted ${uploadedDoc.extractedClaimsCount} claims.`,
      workspaceId: activeWorkspaceId,
      workspaceName: activeWorkspace.name,
      severity: (uploadedDoc.contradictionsCount || 0) > 0 ? 'warning' : 'success',
    });

    // Extract candidate options from uploaded document
    const extracted = extractOptionsFromDocument({
      title: meta?.title || file.name,
      fileName: file.name,
      summary: meta?.summary,
      workspaceId: activeWorkspaceId,
    });

    if (extracted.options.length > 0) {
      setOptions(prev => {
        const withoutCurrent = prev.filter(o => o.workspaceId !== activeWorkspaceId);
        return [...extracted.options, ...withoutCurrent];
      });
      if (extracted.defaultConstraints) {
        setConstraints(prev => ({
          ...prev,
          ...extracted.defaultConstraints,
        }));
      }
    }

    return uploadedDoc;
  };

  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        setActiveWorkspaceId,
        createWorkspace,
        documents,
        addDocument,
        uploadPdfDocument,
        deleteDocument,
        options: currentWorkspaceOptions,
        constraints,
        setConstraints,
        updateConstraint,
        updatePriorityWeight,
        isSolarWorkspace,
        availablePresets,
        activePresetId,
        applyPreset,
        resetConstraints,
        simulationResults,
        baselineResults,
        activities,
        addActivity,
        selectedOptionId,
        setSelectedOptionId,
        globalSearch,
        setGlobalSearch,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
