import React, { useState } from 'react';

const IntelligenceHub = ({ code }) => {
  const [dismissedInsights, setDismissedInsights] = useState(new Set());

  // Mock AI insights - in real implementation these would come from analysis
  const mockInsights = [
    {
      id: 'insight-1',
      type: 'conceptual-drift',
      title: 'Conceptual Drift Detected',
      message: 'This code has been applied differently over the past week. Recent uses focus more on economic barriers.',
      action: 'Review Recent Usage',
      severity: 'medium'
    },
    {
      id: 'insight-2',
      type: 'connection-opportunity',
      title: 'Connection Opportunity',
      message: "This code is often linked to 'Socioeconomic Status'. Consider exploring these connections.",
      action: 'Explore Connections',
      severity: 'low'
    },
    {
      id: 'insight-3',
      type: 'usage-pattern',
      title: 'Usage Pattern',
      message: 'This code appears frequently with geographic references. Consider creating a related code.',
      action: 'View Patterns',
      severity: 'low'
    }
  ];

  const activeInsights = mockInsights.filter(insight => !dismissedInsights.has(insight.id));

  const dismissInsight = (insightId) => {
    setDismissedInsights(prev => new Set([...prev, insightId]));
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'conceptual-drift':
        return '⚠️';
      case 'connection-opportunity':
        return '💡';
      case 'usage-pattern':
        return '📊';
      default:
        return '💡';
    }
  };

  const getInsightColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (activeInsights.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">INTELLIGENCE HUB - AI INSIGHTS</h3>
      <div className="space-y-3">
        {activeInsights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border transition-all ${getInsightColor(insight.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <span className="text-lg">{getInsightIcon(insight.type)}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-700 mt-1">{insight.message}</p>
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2">
                    {insight.action}
                  </button>
                </div>
              </div>
              <button
                onClick={() => dismissInsight(insight.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntelligenceHub;
