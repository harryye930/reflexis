import React from 'react';
import CodeChip from './CodeChip.js';

const StrategySelector = ({ 
  strategies, 
  selectedStrategy, 
  onStrategySelect,
  // New optional multi-select mode (backwards compatible)
  multiSelect = false,
  selectedStrategies = [],
  onStrategiesChange,
  title = "Choose Strategy",
  description = "Select how you would like to proceed."
}) => {
  const isSelected = (id) => {
    return multiSelect ? selectedStrategies.includes(id) : selectedStrategy === id;
  };

  const handleToggle = (id) => {
    if (multiSelect) {
      if (!onStrategiesChange) return;
      const next = selectedStrategies.includes(id)
        ? selectedStrategies.filter(sid => sid !== id)
        : [...selectedStrategies, id];
      onStrategiesChange(next);
    } else {
      onStrategySelect && onStrategySelect(id);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {description}
      </p>

      <div className="space-y-3 mb-6">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            onClick={() => handleToggle(strategy.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              isSelected(strategy.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {multiSelect ? (
                <div
                  className={`w-4 h-4 mt-1 rounded-[4px] border-2 flex items-center justify-center ${
                    isSelected(strategy.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected(strategy.id) && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ) : (
                <div 
                  className={`w-4 h-4 rounded-full border-2 mt-1 ${
                    isSelected(strategy.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected(strategy.id) && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{strategy.title}</h4>
                  {strategy.codeChip && (
                    <CodeChip 
                      code={strategy.codeChip}
                      size="md"
                      variant="unified"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {strategy.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategySelector;
