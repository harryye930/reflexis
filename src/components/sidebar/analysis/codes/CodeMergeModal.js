import React, { useState, useEffect } from 'react';
import { CODE_COLOR_OPTIONS } from '../../../../constants/codeColors.js';

const CodeMergeModal = ({ 
  allCodes,
  currentUser,
  userProfiles,
  onMergeCodes,
  onClose,
  onMessage
}) => {
  const [step, setStep] = useState(1); // 1: Select codes, 2: Choose merge strategy, 3: Configure result
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [mergeStrategy, setMergeStrategy] = useState('');
  const [resultConfig, setResultConfig] = useState({
    label: '',
    description: '',
    color: 'bg-gray-200',
    textColor: 'text-gray-800'
  });
  const [loading, setLoading] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    setStep(1);
    setSelectedCodes([]);
    setMergeStrategy('');
    setResultConfig({
      label: '',
      description: '',
      color: 'bg-gray-200',
      textColor: 'text-gray-800'
    });
  }, []);

  const getUserName = (userId) => {
    if (userId === 'system') return 'System';
    if (userId && userProfiles[userId]) {
      const authorName = userProfiles[userId].name;
      const isCurrentUser = currentUser && userId === currentUser.uid;
      return isCurrentUser ? `${authorName} (you)` : authorName;
    }
    return 'Unknown';
  };

  const handleCodeSelection = (code) => {
    setSelectedCodes(prev => {
      const isSelected = prev.find(c => c.id === code.id);
      if (isSelected) {
        return prev.filter(c => c.id !== code.id);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleNextStep = () => {
    if (step === 1 && selectedCodes.length < 2) {
      onMessage('Please select at least 2 codes to merge', true);
      return;
    }
    if (step === 2 && !mergeStrategy) {
      onMessage('Please select a merge strategy', true);
      return;
    }
    setStep(step + 1);
  };

  const handleStrategySelect = (strategy) => {
    setMergeStrategy(strategy);
    
    // Auto-populate result config based on strategy
    if (strategy.startsWith('merge_into_')) {
      // Extract the code ID from the strategy
      const targetCodeId = strategy.replace('merge_into_', '');
      const targetCode = selectedCodes.find(c => c.id === targetCodeId);
      if (targetCode) {
        setResultConfig({
          label: targetCode.label,
          description: targetCode.description,
          color: targetCode.color,
          textColor: targetCode.textColor
        });
      }
    } else if (strategy === 'create_new') {
      // Create combined label and description
      const combinedLabel = selectedCodes.map(c => c.label).join(' + ');
      const combinedDescription = `Merged from: ${selectedCodes.map(c => c.label).join(', ')}. ${selectedCodes.map(c => c.description).join(' ')}`;
      
      setResultConfig({
        label: combinedLabel.length > 20 ? combinedLabel.substring(0, 17) + '...' : combinedLabel,
        description: combinedDescription.length > 200 ? combinedDescription.substring(0, 197) + '...' : combinedDescription,
        color: selectedCodes[0].color,
        textColor: selectedCodes[0].textColor
      });
    }
  };

  const handleMerge = async () => {
    if (!resultConfig.label.trim() || !resultConfig.description.trim()) {
      onMessage('Both label and description are required', true);
      return;
    }

    setLoading(true);
    try {
      const result = await onMergeCodes({
        selectedCodes,
        strategy: mergeStrategy,
        resultConfig,
        userId: currentUser.uid
      });

      if (result.success) {
        const highlightCount = result.highlightsMoved || 0;
        const reflexiveCount = result.reflexiveResponsesMoved || 0;
        let message = 'Codes merged successfully!';
        
        if (highlightCount > 0 || reflexiveCount > 0) {
          const details = [];
          if (highlightCount > 0) {
            details.push(`${highlightCount} highlight${highlightCount !== 1 ? 's' : ''}`);
          }
          if (reflexiveCount > 0) {
            details.push(`${reflexiveCount} reflexive response${reflexiveCount !== 1 ? 's' : ''}`);
          }
          message += ` Transferred: ${details.join(' and ')}.`;
        }
        
        onMessage(message);
        onClose();
      } else {
        onMessage('Failed to merge codes', true);
      }
    } catch (error) {
      console.error('Error merging codes:', error);
      onMessage('Failed to merge codes', true);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNum 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {stepNum}
          </div>
          {stepNum < 3 && (
            <div 
              className={`w-8 h-1 mx-2 ${
                step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select Codes to Merge</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose 2 or more codes to merge. Selected codes will be combined according to your chosen strategy.
      </p>
      
      <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
        {allCodes.map(code => (
          <div
            key={code.id}
            onClick={() => handleCodeSelection(code)}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selectedCodes.find(c => c.id === code.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  selectedCodes.find(c => c.id === code.id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedCodes.find(c => c.id === code.id) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <div className="flex-1">
                <div className={`code-palette-unified w-full text-left p-3 rounded-xl border border-gray-100 ${code.color} ${code.textColor} font-medium transition-all duration-200`}>
                  <div className="font-medium text-sm mb-1">
                    {code.label}
                  </div>
                  <p className="text-xs opacity-80">{code.description}</p>
                  <p className="text-xs opacity-60 mt-1">by {getUserName(code.createdBy)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-600 mb-4">
        Selected: {selectedCodes.length} code{selectedCodes.length !== 1 ? 's' : ''}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Merge Strategy</h3>
      <p className="text-sm text-gray-600 mb-4">
        How would you like to merge the selected codes?
      </p>

      <div className="space-y-3 mb-6">
        {/* Show merge into option for each selected code */}
        {selectedCodes.map((code, index) => (
          <div
            key={code.id}
            onClick={() => handleStrategySelect(`merge_into_${code.id}`)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              mergeStrategy === `merge_into_${code.id}`
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div 
                className={`w-4 h-4 rounded-full border-2 mt-1 ${
                  mergeStrategy === `merge_into_${code.id}`
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {mergeStrategy === `merge_into_${code.id}` && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">Merge all into</h4>
                  <span className={`code-palette-unified px-3 py-1 text-sm rounded-full ${code.color} ${code.textColor} font-medium`}>
                    {code.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Keep &ldquo;{code.label}&rdquo; and merge all highlights from other codes into it. Other codes will be deleted.
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Create new option */}
        <div
          onClick={() => handleStrategySelect('create_new')}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            mergeStrategy === 'create_new'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div 
              className={`w-4 h-4 rounded-full border-2 mt-1 ${
                mergeStrategy === 'create_new'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {mergeStrategy === 'create_new' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Create new merged code</h4>
              <p className="text-sm text-gray-600 mt-1">
                Create a new code that combines the selected codes. All highlights will be transferred to the new code and old codes will be deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Result</h3>
      <p className="text-sm text-gray-600 mb-4">
        {mergeStrategy === 'create_new' 
          ? 'Configure the new merged code:'
          : (() => {
              const targetCodeId = mergeStrategy.replace('merge_into_', '');
              const targetCode = selectedCodes.find(c => c.id === targetCodeId);
              return `Configure the target code "${targetCode?.label}":`;
            })()
        }
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={resultConfig.label}
            onChange={(e) => setResultConfig(prev => ({ ...prev, label: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Code label"
            maxLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">{resultConfig.label.length}/20</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={resultConfig.description}
            onChange={(e) => setResultConfig(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Code description"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">{resultConfig.description.length}/200</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Theme
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CODE_COLOR_OPTIONS.map((option) => (
              <button
                key={option.bg}
                type="button"
                onClick={() => setResultConfig(prev => ({ 
                  ...prev, 
                  color: option.bg, 
                  textColor: option.text 
                }))}
                className={`code-palette-unified px-3 py-2 text-sm rounded-md ${option.bg} ${option.text} ${
                  resultConfig.color === option.bg ? 'ring-2 ring-blue-500' : 'border border-gray-200'
                } hover:ring-2 hover:ring-blue-300 transition-all`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Merge Summary</h4>
        <p className="text-sm text-blue-800">
          {mergeStrategy === 'create_new' 
            ? `Creating new code and transferring all highlights from ${selectedCodes.length} codes. Original codes will be deleted.`
            : (() => {
                const targetCodeId = mergeStrategy.replace('merge_into_', '');
                const targetCode = selectedCodes.find(c => c.id === targetCodeId);
                const sourceCount = selectedCodes.length - 1;
                return `Merging ${sourceCount} code${sourceCount !== 1 ? 's' : ''} into "${targetCode?.label}". Source codes will be deleted.`;
              })()
          }
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Merge Codes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {renderStepIndicator()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Action buttons */}
        <div className="flex justify-between pt-6 border-t">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            
            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={loading || (step === 1 && selectedCodes.length < 2) || (step === 2 && !mergeStrategy)}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleMerge}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                disabled={loading || !resultConfig.label.trim() || !resultConfig.description.trim()}
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Merge Codes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeMergeModal;
