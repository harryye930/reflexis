import React from 'react';
import { getDisagreementColorClasses, formatDisagreementPercentage } from '../../lib/utils/disagreementUtils.js';

const DisagreementMetric = ({ 
  disagreementData, 
  size = 'sm', 
  showLabel = true, 
  showPercentage = false, // Changed default to false to prefer intuitive labels
  variant = 'badge' // 'badge' | 'dot' | 'full'
}) => {
  if (!disagreementData) {
    return null;
  }

  const { agreementPercentage, disagreementLevel, color, hasMultipleUsers } = disagreementData;

  const disagreementPercentage = formatDisagreementPercentage(agreementPercentage);
  
  // Size classes
  const sizeClasses = {
    xs: 'text-xs px-1 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const dotSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5', 
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (variant === 'dot') {
    return (
      <div 
        className={`${dotSizeClasses[size]} rounded-full ${getDisagreementColorClasses(color, 'dot')}`}
        title={`${disagreementLevel}: ${disagreementPercentage} disagreement`}
      />
    );
  }

  if (variant === 'badge') {
    return (
      <span 
        className={`inline-flex items-center gap-1 ${sizeClasses[size]} rounded-full font-medium ${getDisagreementColorClasses(color, 'bg')} ${getDisagreementColorClasses(color, 'text')} border ${getDisagreementColorClasses(color, 'border')}`}
        title={`${disagreementLevel}: ${disagreementPercentage} disagreement`}
      >
        {showLabel && (
          <span className="whitespace-nowrap">{disagreementLevel}</span>
        )}
        {showLabel && showPercentage && <span>•</span>}
        {showPercentage && (
          <span>{disagreementPercentage}</span>
        )}
      </span>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`p-3 rounded-lg ${getDisagreementColorClasses(color, 'bg')} ${getDisagreementColorClasses(color, 'border')} border`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`font-medium ${getDisagreementColorClasses(color, 'text')}`}>
            Discussion Status
          </span>
          <span className={`text-sm font-bold ${getDisagreementColorClasses(color, 'text')}`}>
            {disagreementLevel}
          </span>
        </div>
        <div className="space-y-1">
          <p className={`text-sm ${getDisagreementColorClasses(color, 'text')}`}>
            {disagreementData.details}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
            <span>{disagreementData.totalHighlights} highlights</span>
            <span>{disagreementData.uniqueUsers} users</span>
            {disagreementData.overlappingSegments > 0 && (
              <span>{disagreementData.overlappingSegments} overlapping segments</span>
            )}
            {showPercentage && (
              <span>{disagreementPercentage} disagreement</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DisagreementMetric;
