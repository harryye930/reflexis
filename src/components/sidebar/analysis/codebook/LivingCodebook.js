import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ReflexiveService } from '../../../../services/api/firebase/reflexiveService.js';
import { CodeService } from '../../../../services/api/firebase/codeService.js';
import LivingCodebookHeader from './LivingCodebookHeader.js';
import CodeApplications from './CodeApplications.js';
import ReflexiveStream from './tabs/reflexive/ReflexiveStream.js';
import CodeHistory from './tabs/history/CodeHistory.js';
import DisagreementTab from './tabs/disagreement/DisagreementTab.js';

const LivingCodebook = ({ 
  projectId,
  code,
  currentUser,
  userProfiles,
  onBack,
  onEditCode,
  onDeleteCode,
  onMessage,
  onCheckCodeUsage,
  onDeleteHighlightsByCode,
  onUpdateCodeInLivingCodebook,
  onNavigateToHighlight,
  getCodeDisagreement = null, // New prop for disagreement data
  showCodeDetails = true // New prop for showing/hiding code details
}) => {
  const reflexiveService = useMemo(() => (
    projectId ? new ReflexiveService(projectId) : null
  ), [projectId]);
  const codeService = useMemo(() => (
    projectId ? new CodeService(projectId) : null
  ), [projectId]);
  const [activeTab, setActiveTab] = useState('reflexive');
  const [reflexiveResponses, setReflexiveResponses] = useState([]);
  const [codeHistory, setCodeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    label: '',
    description: '',
    color: '',
    textColor: ''
  });
  const prevCodeIdRef = useRef();

  // Initialize edit form when code changes
  useEffect(() => {
    if (code) {
      setEditForm({
        label: code.label || '',
        description: code.description || '',
        color: code.color,
        textColor: code.textColor
      });
    }
  }, [code]);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    setEditForm({
      label: code.label || '',
      description: code.description || '',
      color: code.color,
      textColor: code.textColor
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.label.trim() || !editForm.description.trim()) {
      if (onMessage) onMessage('Both label and description are required', true);
      return;
    }
    
    const result = await onEditCode(code.docId || code.id, {
      label: editForm.label.trim(),
      description: editForm.description.trim(),
      color: editForm.color,
      textColor: editForm.textColor
    });
    
    if (result?.success) {
      if (onMessage) onMessage('Code updated successfully!');
      setIsEditing(false);
      
      // Call parent to update selectedCode to latest from allCodes
      if (onUpdateCodeInLivingCodebook) {
        onUpdateCodeInLivingCodebook({ id: code.id, docId: code.docId });
      }
    } else {
      if (onMessage) onMessage('Failed to update code', true);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteCode || !onCheckCodeUsage || !onDeleteHighlightsByCode) return;
    
    // Check if the code is being used in any highlights
    const usage = await onCheckCodeUsage(code.id);
    
    let confirmMessage = `Are you sure you want to delete the "${code.label}" code?`;
    
    if (usage.count > 0) {
      confirmMessage += `\n\nWarning: This code is currently used in ${usage.count} highlight${usage.count > 1 ? 's' : ''}. Deleting this code will also remove all associated highlights.`;
    }
    
    if (!confirm(confirmMessage)) return;

    // If there are highlights using this code, delete them first
    if (usage.count > 0) {
      const highlightDeleteResult = await onDeleteHighlightsByCode(code.id);
      if (!highlightDeleteResult.success) {
        if (onMessage) onMessage('Failed to delete associated highlights', true);
        return;
      }
    }

    const result = await onDeleteCode(code.docId || code.id);
    if (result?.success) {
      const message = usage.count > 0 
        ? `Code deleted successfully! ${usage.count} associated highlight${usage.count > 1 ? 's were' : ' was'} also removed.`
        : 'Code deleted successfully!';
      if (onMessage) onMessage(message);
      
      // Navigate back to all codes after successful deletion
      onBack();
    } else {
      if (onMessage) onMessage('Failed to delete code', true);
    }
  };

  // Load reflexive responses for this code
  useEffect(() => {
    if (!code || !reflexiveService) return;

    setLoading(true);
    try {
      const unsubscribe = reflexiveService.onReflexiveResponsesByCodeSnapshot(
        code.id, 
        (responses) => {
          setReflexiveResponses(responses);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      setReflexiveResponses([]);
      setLoading(false);
    }
  }, [code, reflexiveService]);

  // Load code history for this code
  useEffect(() => {
    if (!code || !codeService) {
      setCodeHistory([]);
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    try {
      const unsubscribe = codeService.onCodeHistorySnapshot(code.id, (historyData) => {
        setCodeHistory(historyData);
        setHistoryLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('LivingCodebook: Error loading code history:', error);
      setCodeHistory([]);
      setHistoryLoading(false);
    }
  }, [code, codeService]);

  // Different tabs for regular codes vs deleted codes
  const tabs = code?.isDeleted 
    ? [{ id: 'history', label: 'History'}] // Only show history for deleted codes
    : [
        { id: 'reflexive', label: 'Reflexive Stream' },
        { id: 'disagreement', label: 'Discussion Focus' },
        { id: 'history', label: 'History'}
      ];

  // Set appropriate default tab when code changes
  useEffect(() => {
    const currentCodeId = code?.id;
    const hasCodeChanged = prevCodeIdRef.current !== currentCodeId;
    
    if (hasCodeChanged) {
      if (code?.isDeleted) {
        // Deleted codes should show history by default
        setActiveTab('history');
      } else if (code && !code.isDeleted) {
        // For non-deleted codes, default to reflexive
        setActiveTab('reflexive');
      }
      prevCodeIdRef.current = currentCodeId;
    }
  }, [code]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reflexive':
        return (
          <ReflexiveStream 
            responses={reflexiveResponses}
            currentUser={currentUser}
            userProfiles={userProfiles}
            loading={loading}
            onNavigateToHighlight={onNavigateToHighlight}
          />
        );
      case 'disagreement':
        return (
          <DisagreementTab 
            code={code}
            getCodeDisagreement={getCodeDisagreement}
          />
        );
      case 'history':
        return (
          <CodeHistory 
            code={code} 
            userProfiles={userProfiles} 
            history={codeHistory}
            loading={historyLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col living-codebook-enter">
      {/* Header */}
      <LivingCodebookHeader 
        code={code}
        onBack={onBack}
        onStartEdit={handleStartEdit}
        onDelete={handleDelete}
        currentUser={currentUser}
        isEditing={isEditing}
        editForm={editForm}
        setEditForm={setEditForm}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
      />

      {/* Code Applications - only for active codes and when code details are enabled */}
      {!code?.isDeleted && showCodeDetails && (
        <CodeApplications 
          projectId={projectId}
          code={code}
          userProfiles={userProfiles}
          onNavigateToHighlight={onNavigateToHighlight}
        />
      )}

      {/* Content Tabs */}
      {showCodeDetails && (
        <div className="flex-1 flex flex-col code-transition-enter">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
      )}
    </div>
  );
};

export default LivingCodebook;
