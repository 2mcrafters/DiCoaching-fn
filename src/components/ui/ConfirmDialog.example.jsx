// Example: How to add ConfirmDialog to any component

import React from "react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

function ExampleComponent() {
  // 1. Add the hook
  const { confirmDelete, ConfirmDialog } = useConfirmDialog();

  // 2. Use confirmDelete in your handler
  const handleDelete = async (itemId) => {
    const confirmed = await confirmDelete({
      title: "Supprimer cet élément ?",
      description: "Cette action est irréversible. L'élément sera définitivement supprimé.",
      confirmText: "Supprimer",
      cancelText: "Annuler"
    });

    if (!confirmed) {
      return; // User cancelled
    }

    // User confirmed, proceed with deletion
    try {
      await apiService.deleteItem(itemId);
      toast({
        title: "Succès",
        description: "L'élément a été supprimé."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'élément.",
        variant: "destructive"
      });
    }
  };

  // 3. Add ConfirmDialog to your JSX
  return (
    <div>
      <Button onClick={() => handleDelete(123)}>
        <Trash2 className="h-4 w-4 mr-2" />
        Supprimer
      </Button>
      
      {/* Important: Add the dialog component */}
      {ConfirmDialog}
    </div>
  );
}

// ========================================
// Advanced Example: Multiple Confirm Actions
// ========================================

function AdvancedExample() {
  const { confirmDelete, ConfirmDialog } = useConfirmDialog();

  const handleArchive = async () => {
    const confirmed = await confirmDelete({
      title: "Archiver ce terme ?",
      description: "Le terme sera déplacé dans les archives et ne sera plus visible.",
      confirmText: "Archiver",
      cancelText: "Annuler",
      destructive: false // Non-destructive action (blue button)
    });

    if (confirmed) {
      // Archive the term
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete({
      title: "Supprimer définitivement ?",
      description: "Cette action est irréversible. Le terme sera supprimé de la base de données.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      destructive: true // Destructive action (red button)
    });

    if (confirmed) {
      // Delete the term
    }
  };

  return (
    <div>
      <Button onClick={handleArchive}>Archiver</Button>
      <Button variant="destructive" onClick={handleDelete}>
        Supprimer
      </Button>
      
      {ConfirmDialog}
    </div>
  );
}

// ========================================
// Example: Inline Usage
// ========================================

function InlineExample() {
  const { confirmDelete, ConfirmDialog } = useConfirmDialog();

  return (
    <div>
      <Button
        onClick={async () => {
          const confirmed = await confirmDelete({
            title: "Quitter sans enregistrer ?",
            description: "Vos modifications seront perdues.",
            confirmText: "Quitter",
            cancelText: "Continuer l'édition"
          });

          if (confirmed) {
            navigate("/");
          }
        }}
      >
        Annuler
      </Button>

      {ConfirmDialog}
    </div>
  );
}

export { ExampleComponent, AdvancedExample, InlineExample };
