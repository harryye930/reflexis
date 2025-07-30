import React from 'react';
import DisagreementMetric from '../../../../../analysis/DisagreementMetric.js';
import { formatDisagreementPercentage } from '../../../../../../lib/utils/disagreementUtils.js';

const DisagreementTab = ({ 
  code, 
  getCodeDisagreement
}) => {
  // Get disagreement data for this specific code
  const disagreementData = getCodeDisagreement ? getCodeDisagreement(code.id) : null;

  if (!disagreementData) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-sm text-gray-600">
            Unable to load disagreement data for this code.
          </p>
        </div>
      </div>
    );
  }

  const {
    agreementPercentage,
    disagreementLevel,
    color,
    totalHighlights,
    uniqueUsers,
    hasMultipleUsers,
    overlappingSegments,
    totalSegments,
    details
  } = disagreementData;

  if (!hasMultipleUsers) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Single User Code</h3>
            <p className="text-sm text-gray-600">
              Only one user has applied this code, so there&apos;s no disagreement to measure.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              <p><strong>{totalHighlights}</strong> highlight{totalHighlights !== 1 ? 's' : ''} applied</p>
              <p>by <strong>1</strong> user</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const disagreementPercentage = 100 - agreementPercentage;

  return (
    <div className="p-6 space-y-6">
      {/* Header with main metric */}
      <div className="text-center">
        <div className="mb-4">
          <DisagreementMetric 
            disagreementData={disagreementData}
            variant="full"
          />
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agreement Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Agreement Analysis</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Agreement Level:</span>
              <span className="text-sm font-medium text-green-600">
                {agreementPercentage}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Discussion Status:</span>
              <span className="text-sm font-medium" style={{ 
                color: color === 'red' ? '#dc2626' : 
                       color === 'orange' ? '#ea580c' : 
                       color === 'yellow' ? '#ca8a04' : '#16a34a' 
              }}>
                {formatDisagreementPercentage(agreementPercentage)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recommendation:</span>
              <span className="text-sm font-medium">{disagreementLevel}</span>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Usage Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Highlights:</span>
              <span className="text-sm font-medium">{totalHighlights}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unique Users:</span>
              <span className="text-sm font-medium">{uniqueUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Text Segments:</span>
              <span className="text-sm font-medium">{totalSegments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overlapping Segments:</span>
              <span className="text-sm font-medium">{overlappingSegments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Understanding Discussion Status</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Discussion Status</strong> indicates whether this code needs team discussion based on 
            how consistently different researchers apply it. This helps prioritize which codes to discuss 
            during team meetings.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">No Discussion Needed</span>
              </div>
              <p className="text-xs">Consistent code application across researchers</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">Minor Disagreement</span>
              </div>
              <p className="text-xs">Small variations in application</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="font-medium">May Need Discussion</span>
              </div>
              <p className="text-xs">Consider discussing in team meetings</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">Needs Discussion</span>
              </div>
              <p className="text-xs">Prioritize for team discussion and refinement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">How This Works</h4>
        <p className="text-sm text-gray-600">
          {details}
        </p>
        <div className="mt-3 text-xs text-gray-500">
          <p>
            This recommendation is based on analyzing how consistently different researchers 
            apply this code to the same text segments. It provides a simple way to identify 
            which codes might benefit from team discussion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisagreementTab;
