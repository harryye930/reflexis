import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { calculateCodeDisagreement } from '../lib/utils/disagreementUtils.js';

/**
 * Hook to manage code disagreement calculations with real-time updates
 * @param {string} appId - The application ID  
 * @param {Array} allCodes - Array of all codes
 * @param {Object} userProfiles - User profiles object
 * @returns {Object} Disagreement data and utilities
 */
export const useCodeDisagreement = (appId, allCodes, userProfiles, currentUser) => {
  const [allHighlights, setAllHighlights] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to all highlights across all documents for real-time updates
  useEffect(() => {
    // Wait for both appId and currentUser to be available
    if (!appId || !currentUser) {
      setAllHighlights([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Query all highlights across all documents
    const highlightsCollection = collection(db, `artifacts/${appId}/public/data/highlights`);
    
    const unsubscribe = onSnapshot(highlightsCollection, (snapshot) => {
      const highlightsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setAllHighlights(highlightsData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to highlights:', error);
      setAllHighlights([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appId, currentUser]);

  // Calculate disagreement metrics for all codes
  const codeDisagreementData = useMemo(() => {
    if (!allCodes || !allHighlights) return {};

    const disagreementMap = {};

    allCodes.forEach(code => {
      // Get all highlights for this code
      const codeHighlights = allHighlights.filter(h => h.code === code.id);
      
      // Get unique users who have used this code
      const uniqueUsers = [...new Set(codeHighlights.map(h => h.userId))];
      
      // Calculate disagreement metrics
      const disagreementData = calculateCodeDisagreement(codeHighlights, uniqueUsers);
      
      disagreementMap[code.id] = {
        ...disagreementData,
        codeId: code.id,
        codeLabel: code.label
      };
    });

    return disagreementMap;
  }, [allCodes, allHighlights]);

  /**
   * Get disagreement data for a specific code
   * @param {string} codeId - The code ID
   * @returns {Object} Disagreement data for the code
   */
  const getCodeDisagreement = (codeId) => {
    return codeDisagreementData[codeId] || {
      agreementPercentage: 100,
      disagreementLevel: 'No Data',
      color: 'gray',
      totalHighlights: 0,
      uniqueUsers: 0,
      hasMultipleUsers: false,
      details: 'No data available'
    };
  };

  /**
   * Get all codes sorted by disagreement level (highest first)
   * @returns {Array} Array of codes with disagreement data
   */
  const getCodesByDisagreement = () => {
    return allCodes
      .map(code => ({
        ...code,
        disagreement: getCodeDisagreement(code.id)
      }))
      .sort((a, b) => {
        // Sort by disagreement percentage (100 - agreement)
        const aDisagreement = 100 - a.disagreement.agreementPercentage;
        const bDisagreement = 100 - b.disagreement.agreementPercentage;
        return bDisagreement - aDisagreement;
      });
  };

  /**
   * Get summary statistics for all codes
   * @returns {Object} Summary statistics
   */
  const getDisagreementSummary = () => {
    const codesWithData = Object.values(codeDisagreementData)
      .filter(d => d.hasMultipleUsers);
    
    if (codesWithData.length === 0) {
      return {
        totalCodes: allCodes?.length || 0,
        codesWithMultipleUsers: 0,
        averageAgreement: 100,
        highDisagreementCodes: 0
      };
    }

    const avgAgreement = codesWithData.reduce((sum, d) => sum + d.agreementPercentage, 0) / codesWithData.length;
    const highDisagreement = codesWithData.filter(d => (100 - d.agreementPercentage) >= 40).length;

    return {
      totalCodes: allCodes?.length || 0,
      codesWithMultipleUsers: codesWithData.length,
      averageAgreement: Math.round(avgAgreement),
      highDisagreementCodes: highDisagreement
    };
  };

  return {
    codeDisagreementData,
    getCodeDisagreement,
    getCodesByDisagreement,
    getDisagreementSummary,
    loading,
    allHighlights
  };
};
