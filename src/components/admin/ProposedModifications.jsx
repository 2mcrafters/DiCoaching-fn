import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, User, Eye, Calendar } from 'lucide-react';

const ProposedModifications = ({ allModifications, allUsers, onUpdate }) => {

  const getUserName = (userId) => {
    const user = allUsers.find(u => u.id === userId);
  return user ? user.name : "Mohamed Rachid Belhadj";
  };

  const pendingModifications = allModifications.filter(m => m.status === 'pending');

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Modifications Proposées</CardTitle>
        <CardDescription>Examinez et validez les modifications de termes proposées.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingModifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Edit className="h-12 w-12 mx-auto mb-4 text-purple-500" />
              <p className="font-medium">Aucune modification en attente.</p>
              <p className="text-sm">Les contributeurs sont sages aujourd'hui.</p>
            </div>
          ) : (
            pendingModifications.map(mod => (
              <Card key={mod.id} className="p-4 bg-background/50 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">Modification pour: <Link to={`/fiche/${mod.termSlug}`} className="text-primary hover:underline">{mod.termTitle}</Link></h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center"><User className="inline h-4 w-4 mr-1.5" /> Proposé par: <span className="font-medium ml-1">{getUserName(mod.proposerId)}</span></span>
                      <span className="flex items-center"><Calendar className="inline h-4 w-4 mr-1.5" /> Le {new Date(mod.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4 sm:mt-0">
                    <Link to={`/modifications/${mod.id}`}>
                      <Eye className="mr-2 h-4 w-4" /> Examiner
                    </Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposedModifications;