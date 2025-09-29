import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UserDetailsDialog from '@/components/admin/UserDetailsDialog';

const PendingAuthors = ({ allUsers, onUpdate }) => {
  const { toast } = useToast();

  const pendingAuthors = allUsers.filter(u => u.role === 'auteur' && u.status === 'pending');

  const handleAuthorAction = (userId, action) => {
    const users = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    let message = '';
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        if (action === 'approve') {
          message = `L'auteur ${u.name} a été approuvé.`;
          return { ...u, status: 'active' };
        } else {
          message = `La candidature de ${u.name} a été rejetée.`;
          return { ...u, status: 'rejected' };
        }
      }
      return u;
    });

    localStorage.setItem('coaching_dict_users', JSON.stringify(updatedUsers));
    onUpdate();
    toast({
      title: "Action effectuée",
      description: message,
    });
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Auteurs en attente de validation</CardTitle>
        <CardDescription>Validez ou rejetez les nouvelles candidatures d'auteurs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingAuthors.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">Aucune nouvelle candidature d'auteur pour le moment.</p>
              <p className="text-sm">Tout est à jour !</p>
            </div>
          ) : (
            pendingAuthors.map(author => (
              <div key={author.id} className="flex items-center justify-between p-4 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors">
                <div>
                  <h4 className="font-medium">{author.name}</h4>
                  <p className="text-sm text-muted-foreground">{author.email}</p>
                  <p className="text-xs text-muted-foreground">Candidature du {new Date(author.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex gap-2">
                  <UserDetailsDialog user={author} />
                  <Button variant="outline" size="sm" onClick={() => handleAuthorAction(author.id, 'approve')} className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50">
                    <CheckCircle className="h-4 w-4 mr-2" /> Approuver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAuthorAction(author.id, 'reject')} className="text-red-600 hover:text-red-700 border-red-500 hover:bg-red-50">
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