import React, { useState, useEffect } from 'react';
import { CODE_COLOR_OPTIONS } from '../../../../constants/codeColors.js';
import CodeChip from '../../../common/CodeChip.js';

const CodeSplitModal = ({ 
  allCodes,
  currentUser,
  userProfiles,
  onSplitCode,
  onClose,
  onMessage
}) => {
  const [step, setStep] = useState(1); // 1: Select code, 2: Review highlights, 3: Review split, 4: Delete confirmation
  const [selectedCode, setSelectedCode] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [reassignments, setReassignments] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableCodes, setAvailableCodes] = useState([]);
  const [highlightReflexiveCounts, setHighlightReflexiveCounts] = useState({});
  const [deleteSourceCode, setDeleteSourceCode] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    setStep(1);
    setSelectedCode(null);
    setHighlights([]);
    setCurrentHighlightIndex(0);
    setReassignments({});
    setHighlightReflexiveCounts({});
    setDeleteSourceCode(false);
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

  const handleCodeSelection = async (code) => {
    setSelectedCode(code);
    setHighlightsLoading(true);
    
    try {
      // Get highlights for this code
      const result = await onSplitCode({
        type: 'getHighlights',
        codeId: code.id
      });
      
      if (result.success) {
        setHighlights(result.highlights);
        // Filter available codes (exclude the selected code)
        setAvailableCodes(allCodes.filter(c => c.id !== code.id));
        
        // Check reflexive count for each highlight
        const reflexiveCounts = {};
        for (const highlight of result.highlights) {
          try {
            const reflexiveResult = await onSplitCode({
              type: 'getReflexiveCount',
              highlightId: highlight.id,
              codeId: code.id
            });
            if (reflexiveResult.success) {
              reflexiveCounts[highlight.id] = reflexiveResult.count;
            }
          } catch (error) {
            console.warn(`Failed to get reflexive count for highlight ${highlight.id}:`, error);
            reflexiveCounts[highlight.id] = 0;
          }
        }
        setHighlightReflexiveCounts(reflexiveCounts);
        
        setStep(2);
      } else {
        onMessage('Failed to load highlights for this code', true);
      }
    } catch (error) {
      console.error('Error loading highlights:', error);
      onMessage('Failed to load highlights for this code', true);
    } finally {
      setHighlightsLoading(false);
    }
  };

  const handleHighlightReassignment = (highlightId, newCodeId, transferReflexiveForThisHighlight = false) => {
    setReassignments(prev => ({
      ...prev,
      [highlightId]: {
        newCodeId,
        transferReflexive: transferReflexiveForThisHighlight
      }
    }));
  };

  const handleNextHighlight = () => {
    if (currentHighlightIndex < highlights.length - 1) {
      setCurrentHighlightIndex(prev => prev + 1);
    } else {
      // All highlights assigned, go to review step
      setStep(3);
    }
  };

  const handlePreviousHighlight = () => {
    if (currentHighlightIndex > 0) {
      setCurrentHighlightIndex(prev => prev - 1);
    }
  };

  const handleCompleteSplit = async () => {
    setLoading(true);
    try {
      // Calculate which highlights should have their reflexive responses transferred
      const transferReflexive = Object.values(reassignments).some(assignment => assignment.transferReflexive);
      
      const result = await onSplitCode({
        type: 'executeSplit',
        sourceCode: selectedCode,
        reassignments,
        transferReflexive,
        forceDeleteSourceCode: deleteSourceCode // Pass user's choice
      });

      if (result.success) {
        const reassignedCount = Object.keys(reassignments).length;
        const transferredReflexiveCount = result.reflexiveResponsesTransferred || 0;
        
        let message = `✂️ Code split completed! ${reassignedCount} highlight${reassignedCount !== 1 ? 's' : ''} reassigned.`;
        
        if (transferredReflexiveCount > 0) {
          message += ` ${transferredReflexiveCount} reflexive response${transferredReflexiveCount !== 1 ? 's' : ''} transferred.`;
        }
        
        if (result.codeDeleted) {
          message += ' Original code was deleted.';
        } else if (deleteSourceCode && !result.codeDeleted) {
          message += ' Original code was kept due to remaining highlights.';
        } else {
          message += ' Original code was kept.';
        }
        
        onMessage(message);
        onClose();
      } else {
        onMessage('Failed to split code', true);
      }
    } catch (error) {
      console.error('Error splitting code:', error);
      onMessage('Failed to split code', true);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3, 4].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNum 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {stepNum}
          </div>
          {stepNum < 4 && (
            <div 
              className={`w-8 h-1 mx-2 ${
                step > stepNum ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select Code to Split</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose a code to split. You&rsquo;ll then reassign its highlights to other codes.
      </p>
      
      <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
        {allCodes.map(code => (
          <div
            key={code.id}
            onClick={() => handleCodeSelection(code)}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selectedCode?.id === code.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  selectedCode?.id === code.id
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedCode?.id === code.id && (
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
    </div>
  );

  const renderStep2 = () => {
    if (highlights.length === 0) {
      return (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">No Highlights Found</h3>
          <p className="text-sm text-gray-600 mb-4">
            The selected code &ldquo;{selectedCode?.label}&rdquo; has no highlights to reassign. 
            The code can be deleted without affecting any content.
          </p>
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-900 mb-2">✂️ Split Summary</h4>
            <p className="text-sm text-orange-800">
              Code &ldquo;{selectedCode?.label}&rdquo; will be deleted as it has no associated highlights.
            </p>
          </div>
        </div>
      );
    }

    const currentHighlight = highlights[currentHighlightIndex];
    const assignment = reassignments[currentHighlight.id];

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Reassign Highlights ({currentHighlightIndex + 1} of {highlights.length})
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          For each highlight coded as &ldquo;{selectedCode?.label}&rdquo;, choose a new code or action.
        </p>

        {/* Current highlight context */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Highlighted Text</h4>
          <div className="bg-white rounded p-3 border">
            <p className="text-sm text-gray-800 leading-relaxed">
              &ldquo;{currentHighlight.text}&rdquo;
            </p>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span>Author: {getUserName(currentHighlight.userId)}</span>
            <span className="mx-2">•</span>
            <span>Document: {currentHighlight.documentTitle || currentHighlight.documentId}</span>
          </div>
        </div>

        {/* Code selection */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-gray-700">Reassign to:</h4>
          
          {/* Available codes */}
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {availableCodes.map((code) => (
              <div
                key={code.id}
                onClick={() => handleHighlightReassignment(currentHighlight.id, code.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  assignment?.newCodeId === code.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-4 h-4 rounded-full border-2 ${
                      assignment?.newCodeId === code.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {assignment?.newCodeId === code.id && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <CodeChip 
                    code={code}
                    size="sm"
                    variant="unified"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Option to transfer reflexive responses if this highlight has any */}
        {assignment?.newCodeId && highlightReflexiveCounts[currentHighlight.id] > 0 && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assignment.transferReflexive || false}
                onChange={(e) => handleHighlightReassignment(
                  currentHighlight.id, 
                  assignment.newCodeId, 
                  e.target.checked
                )}
                className="rounded"
              />
              <span className="text-sm text-indigo-800">
                Transfer {highlightReflexiveCounts[currentHighlight.id]} reflexive response{highlightReflexiveCounts[currentHighlight.id] !== 1 ? 's' : ''} to the new code
              </span>
            </label>
            <p className="text-xs text-indigo-600 mt-1">
              The reflexive Q&A responses for this highlight will be moved to &ldquo;{availableCodes.find(c => c.id === assignment.newCodeId)?.label}&rdquo;
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {Object.keys(reassignments).length} of {highlights.length} highlights assigned
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousHighlight}
              disabled={currentHighlightIndex === 0}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNextHighlight}
              disabled={!assignment?.newCodeId}
              className="px-4 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentHighlightIndex === highlights.length - 1 ? 'Review' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const reassignmentSummary = Object.entries(reassignments).reduce((acc, [highlightId, assignment]) => {
      const code = availableCodes.find(c => c.id === assignment.newCodeId);
      if (code) {
        if (!acc[code.id]) {
          acc[code.id] = { code, count: 0 };
        }
        acc[code.id].count++;
      }
      return acc;
    }, {});

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review Split Summary</h3>
        <p className="text-sm text-gray-600 mb-4">
          Review the reassignments before proceeding to the final step.
        </p>

        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-gray-700">Reassignment Summary:</h4>
          
          {Object.values(reassignmentSummary).map(({ code, count }) => (
            <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CodeChip 
                  code={code}
                  size="sm"
                  variant="unified"
                />
                <span className="text-sm text-gray-700">
                  {count} highlight{count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-900 mb-2">✂️ Split Summary</h4>
          <p className="text-sm text-orange-800">
            Code &ldquo;{selectedCode?.label}&rdquo; will be split into {Object.keys(reassignmentSummary).length} codes. 
            {highlights.length > 0 && Object.keys(reassignments).length === highlights.length 
              ? ' All highlights will be reassigned.'
              : ` ${highlights.length - Object.keys(reassignments).length} highlights will remain with the original code.`
            }
          </p>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const allHighlightsReassigned = highlights.length > 0 && Object.keys(reassignments).length === highlights.length;
    
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Original Code?</h3>
        <p className="text-sm text-gray-600 mb-6">
          {allHighlightsReassigned 
            ? `All highlights from "${selectedCode?.label}" have been reassigned. Would you like to delete the original code?`
            : `Some highlights will remain with "${selectedCode?.label}". You can choose to keep or delete the original code.`
          }
        </p>

        <div className="space-y-3 mb-6">
          <div
            onClick={() => setDeleteSourceCode(false)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              !deleteSourceCode
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div 
                className={`w-4 h-4 rounded-full border-2 mt-1 ${
                  !deleteSourceCode
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}
              >
                {!deleteSourceCode && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Keep Original Code</h4>
                <p className="text-sm text-gray-600">
                  The code &ldquo;{selectedCode?.label}&rdquo; will remain in your codebook.
                  {!allHighlightsReassigned && ' Remaining highlights will stay with this code.'}
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setDeleteSourceCode(true)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              deleteSourceCode
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div 
                className={`w-4 h-4 rounded-full border-2 mt-1 ${
                  deleteSourceCode
                    ? 'border-red-500 bg-red-500'
                    : 'border-gray-300'
                }`}
              >
                {deleteSourceCode && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Delete Original Code</h4>
                <p className="text-sm text-gray-600">
                  The code &ldquo;{selectedCode?.label}&rdquo; will be permanently deleted from your codebook.
                  {!allHighlightsReassigned && ' ⚠️ Warning: This will also delete any remaining highlights that weren\'t reassigned.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${deleteSourceCode ? 'bg-red-50' : 'bg-blue-50'}`}>
          <h4 className={`text-sm font-medium mb-2 ${deleteSourceCode ? 'text-red-900' : 'text-blue-900'}`}>
            Final Summary
          </h4>
          <p className={`text-sm ${deleteSourceCode ? 'text-red-800' : 'text-blue-800'}`}>
            {Object.keys(reassignments).length} highlight{Object.keys(reassignments).length !== 1 ? 's' : ''} will be reassigned to new codes.
            {deleteSourceCode 
              ? ` The original code "${selectedCode?.label}" will be deleted.`
              : ` The original code "${selectedCode?.label}" will be kept.`
            }
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Split Code</h2>
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
        {step === 4 && renderStep4()}

        {/* Action buttons */}
        <div className="flex justify-between pt-6 border-t">
          <div>
            {step > 1 && (
              <button
                onClick={() => {
                  if (step === 3) {
                    setStep(2);
                    setCurrentHighlightIndex(highlights.length - 1);
                  } else {
                    setStep(step - 1);
                  }
                }}
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
            
            {step === 1 && selectedCode && !highlightsLoading && (
              <button
                onClick={() => handleCodeSelection(selectedCode)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Continue
              </button>
            )}
            
            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                disabled={Object.keys(reassignments).length === 0}
              >
                Next
              </button>
            )}
            
            {step === 4 && (
              <button
                onClick={handleCompleteSplit}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
                disabled={loading}
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Complete Split
              </button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default CodeSplitModal;
