import React from 'react';
import CodeChip from './CodeChip.js';

const StrategySelector = ({ 
  strategies, 
  selectedStrategy, 
  onStrategySelect,
  title = "Choose Strategy",
  description = "Select how you would like to proceed."
}) => {
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
            onClick={() => onStrategySelect(strategy.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedStrategy === strategy.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div 
                className={`w-4 h-4 rounded-full border-2 mt-1 ${
                  selectedStrategy === strategy.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedStrategy === strategy.id && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
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
