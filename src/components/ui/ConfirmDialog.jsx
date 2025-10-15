import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

/**
 * Reusable confirmation dialog for delete actions
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onOpenChange - Callback to change open state
 * @param {function} onConfirm - Callback when user confirms
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description
 * @param {string} confirmText - Confirm button text (default: "Supprimer")
 * @param {string} cancelText - Cancel button text (default: "Annuler")
 * @param {boolean} destructive - Whether action is destructive (default: true)
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Êtes-vous sûr ?",
  description = "Cette action est irréversible.",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  destructive = true,
}) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook to use confirm dialog programmatically
 * 
 * Example usage:
 * const { confirmDelete } = useConfirmDialog();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirmDelete({
 *     title: "Supprimer le commentaire ?",
 *     description: "Ce commentaire sera définitivement supprimé."
 *   });
 *   if (confirmed) {
 *     // perform delete
 *   }
 * };
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState({
    open: false,
    title: "",
    description: "",
    confirmText: "Supprimer",
    cancelText: "Annuler",
    destructive: true,
    resolve: null,
  });

  const confirmDelete = React.useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title: options.title || "Êtes-vous sûr ?",
        description: options.description || "Cette action est irréversible.",
        confirmText: options.confirmText || "Supprimer",
        cancelText: options.cancelText || "Annuler",
        destructive: options.destructive !== false,
        resolve,
      });
    });
  }, []);

  const handleOpenChange = React.useCallback((open) => {
    if (!open && dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, open }));
  }, [dialogState.resolve]);

  const handleConfirm = React.useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, open: false }));
  }, [dialogState.resolve]);

  const ConfirmDialogComponent = React.useMemo(
    () => (
      <ConfirmDialog
        open={dialogState.open}
        onOpenChange={handleOpenChange}
        onConfirm={handleConfirm}
        title={dialogState.title}
        description={dialogState.description}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        destructive={dialogState.destructive}
      />
    ),
    [dialogState, handleOpenChange, handleConfirm]
  );

  return { confirmDelete, ConfirmDialog: ConfirmDialogComponent };
}
