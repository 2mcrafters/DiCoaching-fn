import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UserDetailsDialog from '@/components/admin/UserDetailsDialog';
import apiService from "@/services/api";

const PendingAuthors = ({ allUsers, onUpdate }) => {
  const { toast } = useToast();

  const pendingAuthors = allUsers.filter(
    (u) => u.role === "auteur" && u.status === "pending"
  );

  const handleAuthorAction = async (userId, action) => {
    try {
      const author = allUsers.find((u) => u.id === userId);
      let message = "";
      let newStatus = "";

      if (action === "approve") {
        message = `L'auteur ${author.firstname} ${author.lastname} a été approuvé.`;
        newStatus = "confirmed";
      } else {
        message = `La candidature de ${author.firstname} ${author.lastname} a été rejetée.`;
        newStatus = "rejected";
      }

      await apiService.updateUser(userId, { status: newStatus });

      if (typeof onUpdate === "function") {
        onUpdate();
      }

      toast({
        title: "Action effectuée",
        description: message,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de l'auteur.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Auteurs en attente de validation</CardTitle>
        <CardDescription>
          Validez ou rejetez les nouvelles candidatures d'auteurs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingAuthors.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">
                Aucune nouvelle candidature d'auteur pour le moment.
              </p>
              <p className="text-sm">Tout est à jour !</p>
            </div>
          ) : (
            pendingAuthors.map((author) => (
              <div
                key={author.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <h4 className="font-medium">
                    {`${author.firstname || ""} ${
                      author.lastname || ""
                    }`.trim() || author.email}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {author.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Candidature du{" "}
                    {new Date(author.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <UserDetailsDialog user={author} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAuthorAction(author.id, "approve")}
                    className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approuver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAuthorAction(author.id, "reject")}
                    className="text-red-600 hover:text-red-700 border-red-500 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Rejeter
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingAuthors;