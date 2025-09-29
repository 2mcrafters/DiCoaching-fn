import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, FileText, GitPullRequest, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const UserTermsList = ({ userTerms, loading, user }) => {
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Publié</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En révision</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAuthor = user.role === 'auteur';
  const isAdmin = user.role === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Vos Contributions</CardTitle>
              <CardDescription>Gérez vos termes soumis et vos brouillons.</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isAuthor && (
                <Button asChild>
                  <Link to="/submit"><PlusCircle className="h-4 w-4 mr-2" />Nouveau terme</Link>
                </Button>
              )}
              {(isAdmin || isAuthor) && (
                <Button asChild variant="outline">
                  <Link to="/modifications"><GitPullRequest className="h-4 w-4 mr-2" />Modifications</Link>
                </Button>
              )}
              {isAdmin && (
                <Button asChild variant="secondary" className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Link to="/admin"><Shield className="h-4 w-4 mr-2" />Admin</Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-10 text-muted-foreground">Chargement de vos contributions...</p>
          ) : userTerms.length > 0 ? (
            <div className="space-y-4">
              {userTerms.map(term => (
                <motion.div 
                  key={term.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <Link to={`/fiche/${term.slug}`} className="font-semibold text-primary hover:underline">{term.term}</Link>
                    <p className="text-sm text-muted-foreground">{term.category}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(term.status)}
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/edit/${term.slug}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune contribution pour le moment</h3>
              {isAuthor ? (
                <>
                  <p className="text-muted-foreground mb-6">Commencez par ajouter un nouveau terme au dictionnaire.</p>
                  <Button asChild>
                    <Link to="/submit"><PlusCircle className="h-4 w-4 mr-2" />Ajouter votre premier terme</Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Devenez auteur pour commencer à contribuer !</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserTermsList;