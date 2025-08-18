import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@mui/icons-material';
import { CODE_COLOR_OPTIONS } from '../../constants/codeColors.js';
import CodeButton from './HighlightModalCodeButton.js';
import ReflexiveModal from '../reflexive/ReflexiveModal.js';

const HighlightingModal = ({ 
  modalPosition, 
  allCodes, 
  onCodeSelect, 
  onClose,
  selectedText,
  currentUser,
  documentId,
  isDetecting = false
}) => {
  const [showReflexiveModal, setShowReflexiveModal] = useState(false);
  const [selectedCodeForReflexive, setSelectedCodeForReflexive] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const modalRef = useRef(null);

  // Click-outside handling for the highlighting modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && 
          !event.target.closest('.reflexive-modal')) {
        onClose();
      }
    };

    if (!showReflexiveModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [onClose, showReflexiveModal]);

  if (!allCodes || allCodes.length === 0) {
    return null;
  }

  const handleDirectApply = async (codeId) => {
    if (isDetecting) return; // prevent duplicate clicks while detecting
    const result = await onCodeSelect(codeId);
    if (result?.success && result?.highlightId) {
      setHighlightId(result.highlightId);
      // Close modal after successful direct apply
      onClose();
    }
  };

  const handleReflexiveApply = async (code) => {
    if (isDetecting) return; // prevent while detecting
    // Create the highlight first, before starting reflexive process
    // Skip conceptual drift during reflexive flow to avoid double prompts
    const result = await onCodeSelect(code.id, { skipDrift: true });
    
    if (result?.success) {
      // Set highlight ID if available, otherwise use a placeholder
      const highlightId = result.highlightId || `temp_${Date.now()}`;
      setHighlightId(highlightId);
      setSelectedCodeForReflexive(code);
      setShowReflexiveModal(true);
    } else {
      // If highlight creation fails, don't start reflexive process
      const errorMsg = result?.error || 'Unknown error creating highlight';
      console.error('Failed to create highlight before reflexive process:', errorMsg);
      console.error('Full result:', result);
      // The main component should handle showing an error message
      onClose(); // Close the modal since we can't proceed
    }
  };

  const handleReflexiveComplete = async (responses) => {
    // Highlight was already created in handleReflexiveApply
    // Just close the modal
    setShowReflexiveModal(false);
    setSelectedCodeForReflexive(null);
    onClose();
  };

  const handleReflexiveClose = () => {
    setShowReflexiveModal(false);
    setSelectedCodeForReflexive(null);
    // Close the entire highlighting modal when reflexive process is cancelled
    onClose();
  };

  return (
    <>
      {!showReflexiveModal ? (
        <div
          id="coding-modal"
          ref={modalRef}
          className="coding-modal bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200/50 p-4 transition-all duration-300"
          style={{ 
            left: modalPosition.x, 
            top: modalPosition.y,
            minWidth: '320px',
            maxWidth: '400px'
          }}
        >
          {isDetecting && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-transparent"></div>
                <span className="text-sm">Analyzing code drift…</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-4">
            <Label sx={{ fontSize: 18, color: '#3b82f6' }} />
            <p className="text-sm text-gray-700 font-medium">Apply code to selection:</p>
          </div>
          <div id="modal-codes-list" className={`grid grid-cols-2 gap-3 auto-rows-max ${isDetecting ? 'pointer-events-none opacity-60' : ''}`}>
            {allCodes.map(code => (
              <div key={code.id} className="flex justify-center">
                <CodeButton
                  code={code}
                  bgColor={code.color}
                  textColor={code.textColor}
                  onDirectApply={() => handleDirectApply(code.id)}
                  onReflexiveApply={() => handleReflexiveApply(code)}
                />
              </div>
            ))}
          </div>
          
          {/* Enhanced close button */}
          <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-all duration-200"
              disabled={isDetecting}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <ReflexiveModal
          modalPosition={modalPosition}
          selectedCode={selectedCodeForReflexive}
          selectedText={selectedText}
          currentUser={currentUser}
          documentId={documentId}
          highlightId={highlightId}
          onComplete={handleReflexiveComplete}
          onClose={handleReflexiveClose}
        />
      )}
    </>
  );
};

export default HighlightingModal;
