import React, { useState, useEffect } from 'react';
import { appId } from '../../../../constants/index.js';
import { ReflexiveService } from '../../../../services/api/firebase/reflexiveService.js';
import LivingCodebookHeader from './LivingCodebookHeader.js';
import IntelligenceHub from './IntelligenceHub.js';
import ReflexiveStream from './ReflexiveStream.js';
import CodeExemplars from './CodeExemplars.js';
import CodeHistory from './CodeHistory.js';

// Create reflexive service instance outside component to avoid re-instantiation
const reflexiveService = new ReflexiveService(appId);

const LivingCodebook = ({ 
  code,
  currentUser,
  userProfiles,
  onBack,
  onEditCode
}) => {
  const [activeTab, setActiveTab] = useState('reflexive');
  const [reflexiveResponses, setReflexiveResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load reflexive responses for this code
  useEffect(() => {
    if (!code) return;

    setLoading(true);
    
    // Use the real reflexive service to get responses by code
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
      console.error('Error loading reflexive responses:', error);
      // Fallback to empty responses if index doesn't exist
      setReflexiveResponses([]);
      setLoading(false);
    }
  }, [code]);

  const tabs = [
    { id: 'reflexive', label: 'Reflexive Stream', count: reflexiveResponses.length },
    { id: 'exemplars', label: 'Exemplars', count: 0 },
    { id: 'history', label: 'History', count: 0 }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reflexive':
        return (
          <ReflexiveStream 
            responses={reflexiveResponses}
            currentUser={currentUser}
            userProfiles={userProfiles}
            loading={loading}
          />
        );
      case 'exemplars':
        return <CodeExemplars code={code} />;
      case 'history':
        return <CodeHistory code={code} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <LivingCodebookHeader 
        code={code}
        onBack={onBack}
        onEditCode={onEditCode}
        currentUser={currentUser}
      />

      {/* Intelligence Hub */}
      <IntelligenceHub code={code} />

      {/* Content Tabs */}
      <div className="flex-1 flex flex-col">
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
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default LivingCodebook;
