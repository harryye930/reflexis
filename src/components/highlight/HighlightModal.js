import React, { useRef, useEffect, useState } from 'react';
import { Label, Add } from '@mui/icons-material';
import CodeButton from './HighlightModalCodeButton.js';
import CodeForm from '../sidebar/analysis/codes/CodeForm.js';

const HighlightingModal = ({ 
  modalPosition, 
  allCodes, 
  onCodeSelect, 
  onClose,
  selectedText,
  currentUser,
  documentId,
  onAddCode, // new: function to create code
  isDetecting = false,
  // Notify parent to open Reflexive modal at top-level with this highlight
  onStartReflexive
}) => {
  const modalRef = useRef(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialRangeRef = useRef(null);

  // Click-outside handling for the highlighting modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && 
          !event.target.closest('.reflexive-modal')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Capture the initial selection range when the modal opens so we can restore it later
  useEffect(() => {
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        // Only save if selection is not collapsed (i.e., text is selected)
        if (!r.collapsed) {
          initialRangeRef.current = r.cloneRange();
        }
      }
    } catch {}
  }, []);

  const restoreSavedRange = () => {
    try {
      if (initialRangeRef.current) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(initialRangeRef.current);
      }
    } catch {}
  };

  if (!allCodes || allCodes.length === 0) {
    // Still allow adding a new code even if there are no codes
  }

  const handleDirectApply = async (codeId) => {
    if (isDetecting) return; // prevent duplicate clicks while detecting
    // Restore the original text selection before applying
    restoreSavedRange();
    const result = await onCodeSelect(codeId);
    if (result?.success && result?.highlightId) {
      // Close modal after successful direct apply
      onClose();
    }
  };

  const handleReflexiveApply = async (code) => {
    if (isDetecting) return; // prevent while detecting
    // Restore selection to original text before creating highlight
    restoreSavedRange();
    // Create the highlight first, before starting reflexive process
    // Skip conceptual drift during reflexive flow to avoid double prompts
    const result = await onCodeSelect(code.id, { skipDrift: true });
    
    if (result?.success) {
      // Notify parent to open the Reflexive modal at top level with emphasis
      const highlightId = result.highlightId || `temp_${Date.now()}`;
      if (onStartReflexive) {
        onStartReflexive({ highlightId, code, selectedText });
      }
      // Close the coding modal now that reflexive flow is handed to parent
      onClose();
    } else {
      // If highlight creation fails, don't start reflexive process
      const errorMsg = result?.error || 'Unknown error creating highlight';
      console.error('Failed to create highlight before reflexive process:', errorMsg);
      console.error('Full result:', result);
      // The main component should handle showing an error message
      onClose(); // Close the modal since we can't proceed
    }
  };

  // Create a new code using CodeForm, then apply highlight to it
  const handleCreateCodeSubmit = async (formData) => {
    if (!onAddCode || !currentUser) return { success: false, error: 'Add code unavailable' };
    setIsSaving(true);
    try {
      // Generate the code id the same way as elsewhere
      const newId = formData.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const result = await onAddCode({
        label: formData.label,
        description: formData.description,
        color: formData.color,
        textColor: formData.textColor
      });

      if (result?.success) {
        // Apply the highlight to the newly created code
        // Restore selection first as user may have focused the form
        restoreSavedRange();
        const applyResult = await onCodeSelect(newId);
        if (applyResult?.success) {
          setShowAddForm(false);
          onClose();
          return { success: true };
        }
        return { success: false, error: 'Failed to apply highlight' };
      }
      return { success: false, error: 'Failed to create code' };
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCodeCancel = () => {
    // Just close the form — no operations committed
    setShowAddForm(false);
  };

  return (
    <>
      <div
          id="coding-modal"
          ref={modalRef}
          className="coding-modal bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200/50 p-4 transition-all duration-300"
          style={{ 
            left: modalPosition.x, 
            top: modalPosition.y,
            minWidth: '320px',
            maxWidth: '500px',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}
        >
          {isDetecting && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-transparent"></div>
                <span className="text-sm">Analyzing coding consistency...</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-4">
            <Label sx={{ fontSize: 18, color: '#3b82f6' }} />
            <p className="text-sm text-gray-700 font-medium">{showAddForm ? 'Create a new code:' : 'Apply code to selection:'}</p>
          </div>
          {/* Either show the code selector grid or the CodeForm */}
          {!showAddForm ? (
            <div id="modal-codes-list" className={`grid grid-cols-2 gap-4 auto-rows-max max-h-80 overflow-y-auto ${(isDetecting) ? 'pointer-events-none opacity-60' : ''}`}>
              {allCodes && allCodes.map(code => (
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
              {/* Add button tile at the end */}
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className={`flex items-center justify-center border-2 border-dashed border-green-300 hover:border-green-400 hover:bg-green-50 rounded-lg p-4 transition-colors ${(isDetecting) ? 'pointer-events-none opacity-60' : ''}`}
              >
                <div className="flex items-center gap-2 text-green-700">
                  <Add sx={{ fontSize: 18, color: '#10b981' }} />
                  <span className="text-sm font-medium">Add code</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="mt-1 p-3 border border-green-200 rounded-lg bg-green-50">
              <CodeForm
                onSubmit={handleCreateCodeSubmit}
                onCancel={handleCreateCodeCancel}
                onMessage={() => {}}
              />
            </div>
          )}
          
          {/* Enhanced close button */}
          <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-all duration-200"
              disabled={isDetecting || isSaving}
            >
              Cancel
            </button>
          </div>
      </div>
    </>
  );
};

export default HighlightingModal;
