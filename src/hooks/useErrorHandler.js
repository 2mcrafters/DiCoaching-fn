import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for centralized error handling across the application
 * Provides consistent error handling patterns and user feedback
 */
export const useErrorHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Main error handler that categorizes and handles different error types
   * @param {Error} error - The error object to handle
   * @param {Object} options - Configuration options
   * @param {boolean} options.showToast - Whether to show a toast notification (default: true)
   * @param {boolean} options.redirect - Whether to redirect to error page (default: true)
   * @param {string} options.fallbackMessage - Custom fallback message
   */
  const handleError = useCallback(
    (error, options = {}) => {
      const {
        showToast = true,
        redirect = true,
        fallbackMessage = "Une erreur s'est produite",
      } = options;

      // Don't handle abort errors (component unmount)
      if (error?.name === "AbortError" || error?.code === "ABORT_ERR") {
        return;
      }

      console.error("[Error Handler]:", error);

      // Network errors
      if (
        error instanceof TypeError &&
        (error.message === "Failed to fetch" ||
          error.message.includes("NetworkError") ||
          error.message.includes("network"))
      ) {
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: "Vérifiez votre connexion internet et réessayez.",
          });
        }
        if (redirect) {
          navigate("/network-error");
        }
        return;
      }

      // 401 Unauthorized - Session expired
      if (error?.message?.includes("401") || error?.message?.includes("Session expirée")) {
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Session expirée",
            description: "Veuillez vous reconnecter.",
          });
        }
        // API service already handles logout and redirect
        return;
      }

      // 403 Forbidden - Access denied
      if (
        error?.message?.includes("403") ||
        error?.message?.includes("non autorisé") ||
        error?.message?.includes("Forbidden")
      ) {
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions nécessaires.",
          });
        }
        if (redirect) {
          navigate("/unauthorized");
        }
        return;
      }

      // 404 Not Found
      if (error?.message?.includes("404") || error?.message?.includes("introuvable")) {
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Ressource introuvable",
            description: "La ressource demandée n'existe pas ou a été supprimée.",
          });
        }
        if (redirect) {
          navigate("/404");
        }
        return;
      }

      // 500+ Server errors
      if (
        error?.message?.includes("500") ||
        error?.message?.includes("serveur") ||
        error?.message?.match(/5\d{2}/)
      ) {
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Erreur serveur",
            description: "Le serveur rencontre des difficultés. Veuillez réessayer plus tard.",
          });
        }
        if (redirect) {
          navigate("/server-error");
        }
        return;
      }

      // Validation errors (usually 400)
      if (
        error?.message?.includes("400") ||
        error?.message?.includes("validation") ||
        error?.message?.includes("invalide")
      ) {
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Données invalides",
            description: error.message || "Veuillez vérifier les informations saisies.",
          });
        }
        // Don't redirect for validation errors
        return;
      }

      // Generic error
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error?.message || fallbackMessage,
        });
      }
    },
    [navigate, toast]
  );

  /**
   * Wrapper for async operations with automatic error handling
   * @param {Function} asyncFn - The async function to execute
   * @param {Object} errorOptions - Error handling options
   */
  const withErrorHandling = useCallback(
    async (asyncFn, errorOptions = {}) => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error, errorOptions);
        throw error; // Re-throw so caller can handle if needed
      }
    },
    [handleError]
  );

  /**
   * Show a success toast notification
   * @param {string} message - Success message
   * @param {string} title - Toast title (optional)
   */
  const showSuccess = useCallback(
    (message, title = "Succès") => {
      toast({
        title,
        description: message,
      });
    },
    [toast]
  );

  /**
   * Show an info toast notification
   * @param {string} message - Info message
   * @param {string} title - Toast title (optional)
   */
  const showInfo = useCallback(
    (message, title = "Information") => {
      toast({
        title,
        description: message,
      });
    },
    [toast]
  );

  /**
   * Show a warning toast notification
   * @param {string} message - Warning message
   * @param {string} title - Toast title (optional)
   */
  const showWarning = useCallback(
    (message, title = "Attention") => {
      toast({
        variant: "default",
        title,
        description: message,
      });
    },
    [toast]
  );

  return {
    handleError,
    withErrorHandling,
    showSuccess,
    showInfo,
    showWarning,
  };
};

export default useErrorHandler;
