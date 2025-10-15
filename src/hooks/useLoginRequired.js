import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook to handle login required scenarios
 * Returns a function to check auth and show popup if needed
 */
export const useLoginRequired = () => {
  const { user } = useAuth();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    action: 'default',
    title: 'Connexion requise',
    description: 'Vous devez être connecté pour effectuer cette action.'
  });

  /**
   * Check if user is authenticated and show popup if not
   * @param {Object} config - Configuration for the popup
   * @param {string} config.action - Action type (like, comment, reply, report)
   * @param {string} config.title - Custom title
   * @param {string} config.description - Custom description
   * @returns {boolean} - Returns true if user is authenticated
   */
  const requireAuth = useCallback((config = {}) => {
    if (user) {
      return true;
    }

    setPopupConfig({
      action: config.action || 'default',
      title: config.title || 'Connexion requise',
      description: config.description || 'Vous devez être connecté pour effectuer cette action.'
    });
    setIsPopupOpen(true);
    return false;
  }, [user]);

  const closePopup = useCallback(() => {
    setIsPopupOpen(false);
  }, []);

  return {
    requireAuth,
    isPopupOpen,
    closePopup,
    popupConfig
  };
};

export default useLoginRequired;
