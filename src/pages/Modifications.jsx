import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, User, Calendar, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Modifications = () => {
  const { user } = useAuth();
  const [modifications, setModifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allModifications = JSON.parse(localStorage.getItem('coaching_dict_modifications') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
    
    let userModifications;
    if (user.role === 'admin' || user.role === 'auteur') {
      userModifications = allModifications.filter(m => m.status === 'pending');
    } else {
      userModifications = allModifications.filter(m => m.proposerId === user.id);
    }

    setModifications(userModifications.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setUsers(allUsers);
    setLoading(false);
  }, [user]);

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Utilisateur inconnu';
  };
  
  const getStatusVariant = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      default: return 'En attente';
    }
  }


  if (loading) {
    return <div className="text-center py-20">Chargement...</div>;
  }

  const title = (user.role === 'admin' || user.role === 'auteur') 
      ? 'Modifications en attente' 
      : 'Vos Propositions de Modification';

  const description = (user.role === 'admin' || user.role === 'auteur') 
      ? "Examinez les propositions d'amélioration des termes en attente de validation."
      : "Suivez le statut de vos propositions de modification.";

  return (
    <>
      <Helmet>
        <title>{title} - Dictionnaire Collaboratif</title>
        <meta name="description" content={description} />
      </Helmet>
      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </motion.div>

          {modifications.length === 0 ? (
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg"
              >
              <Edit className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">
                { (user.role === 'admin' || user.role === 'auteur') 
                    ? "Aucune modification en attente." 
                    : "Aucune proposition à afficher."
                }
              </h3>
              <p>
                { (user.role === 'admin' || user.role === 'auteur')
                    ? "Toutes les propositions ont été traitées."
                    : "Vous n'avez pas encore proposé de modification."
                }
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {modifications.map((mod, index) => (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className="flex flex-col h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">Modif #{mod.id.slice(-6)}</CardTitle>
                        <Badge variant={getStatusVariant(mod.status)}>{getStatusText(mod.status)}</Badge>
                      </div>
                      <CardDescription>
                        Pour : <Link to={`/fiche/${mod.termSlug}`} className="text-primary hover:underline font-medium">{mod.termTitle}</Link>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                       <p className="text-sm text-muted-foreground flex items-center">
                          <User className="inline h-4 w-4 mr-2" /> 
                          Proposé par : <span className="font-medium ml-1">{getUserName(mod.proposerId)}</span>
                       </p>
                       <p className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="inline h-4 w-4 mr-2" /> 
                          Le {new Date(mod.createdAt).toLocaleDateString('fr-FR')}
                       </p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/modifications/${mod.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> Voir les détails
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modifications;