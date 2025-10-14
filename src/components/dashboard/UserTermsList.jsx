import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Edit,
  FileText,
  GitPullRequest,
  Shield,
  Search,
  BookOpen,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";

const UserTermsList = ({ userTerms, loading, user }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Publié
          </Badge>
        );
      case "review":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            En révision
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Brouillon
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAuthorRole = user.role === "auteur" || user.role === "author";
  const isAdmin = user.role === "admin";
  const { hasAuthorPermissions } = useAuth();
  // Authors may have the role but still be awaiting admin approval; use hasAuthorPermissions
  const canAuthor = isAdmin || (isAuthorRole && hasAuthorPermissions());
  const isAuthor = isAuthorRole;
  const isResearcher = user.role === "chercheur" || user.role === "researcher";

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
              <CardTitle>
                {isResearcher
                  ? "Vos Activités de Recherche"
                  : "Vos Contributions"}
              </CardTitle>
              <CardDescription>
                {isResearcher
                  ? "Explorez et interagissez avec le dictionnaire collaboratif."
                  : "Gérez vos termes soumis et vos brouillons."}
              </CardDescription>
            </div>

            <div className="flex gap-2 flex-wrap">
              {isResearcher && (
                <>
                  <Button asChild>
                    <Link to="/search">
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/modifications">
                      <GitPullRequest className="h-4 w-4 mr-2" />
                      Proposer une modification
                    </Link>
                  </Button>
                </>
              )}
              {/* New term: only enabled for authors with confirmed permissions or admins */}
              {isAuthor &&
                (canAuthor ? (
                  <Button asChild>
                    <Link to="/submit">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Nouveau terme
                    </Link>
                  </Button>
                ) : (
                  <Button
                    disabled
                    title="Votre demande d'auteur est en attente d'approbation"
                    className="opacity-60 cursor-not-allowed"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouveau terme
                  </Button>
                ))}

              {/* Modifications button: available to admins and confirmed authors only (pending authors cannot propose) */}
              {(isAdmin || canAuthor) && (
                <Button asChild variant="outline">
                  <Link to="/modifications">
                    <GitPullRequest className="h-4 w-4 mr-2" />
                    Modifications
                  </Link>
                </Button>
              )}
              {isAdmin && (
                <Button
                  asChild
                  variant="secondary"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Link to="/admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {/* Pending-author banner: placed below the header so it appears under the 'Vos Contributions' cards */}
        {isAuthor && !canAuthor && (
          <div className="mt-3 mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-4 py-3 mx-4">
            Votre demande d'auteur est actuellement en attente d'approbation par
            un administrateur. Vous ne pouvez pas ajouter ni modifier des termes
            tant que votre compte n'est pas validé.
            <div className="mt-1 text-xs text-amber-600">
              Si vous avez des questions, contactez un administrateur.
            </div>
          </div>
        )}
        <CardContent>
          {loading ? (
            <p className="text-center py-10 text-muted-foreground">
              Chargement de vos données...
            </p>
          ) : isResearcher ? (
            // Researcher content - show recent activities and suggestions
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Explorer le Dictionnaire</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Découvrez les termes du coaching et développement personnel.
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link to="/search">Commencer la recherche</Link>
                  </Button>
                </div>
                <div className="p-4 border rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <h4 className="font-medium">Documents de Recherche</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Partagez vos documents et ressources de recherche.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Link to="/profile">Gérer mes documents</Link>
                  </Button>
                </div>
              </div>

              {userTerms.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Termes que vous appréciez
                  </h4>
                  <div className="space-y-2">
                    {userTerms.slice(0, 5).map((term) => (
                      <motion.div
                        key={term.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center justify-between p-3 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <Link
                            to={`/fiche/${term.slug}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {term.term}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {term.category}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          Aimé
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : userTerms.length > 0 ? (
            // Author content (original)
            <div className="space-y-4">
              {userTerms.map((term) => (
                <motion.div
                  key={term.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <Link
                      to={`/fiche/${term.slug}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {term.term}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {term.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(term.status)}
                    {canAuthor ? (
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/edit/${term.slug}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        title="En attente d'approbation"
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // Empty state
            <div className="text-center py-16">
              {isResearcher ? (
                <>
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Commencez votre exploration
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Découvrez les termes du dictionnaire collaboratif et
                    contribuez à la recherche.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button asChild>
                      <Link to="/search">
                        <Search className="h-4 w-4 mr-2" />
                        Explorer le dictionnaire
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/authors">Découvrir les auteurs</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Aucune contribution pour le moment
                  </h3>
                  {isAuthor ? (
                    canAuthor ? (
                      <>
                        <p className="text-muted-foreground mb-6">
                          Commencez par ajouter un nouveau terme au
                          dictionnaire.
                        </p>
                        <Button asChild>
                          <Link to="/submit">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Ajouter votre premier terme
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground mb-6">
                          Votre demande d'auteur est en attente d'approbation
                          par un administrateur. Vous ne pourrez pas ajouter ou
                          modifier des termes tant que votre compte n'est pas
                          approuvé.
                        </p>
                        <Button
                          disabled
                          title="En attente d'approbation"
                          className="opacity-60 cursor-not-allowed"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Ajouter votre premier terme
                        </Button>
                      </>
                    )
                  ) : (
                    <p className="text-muted-foreground">
                      Devenez auteur pour commencer à contribuer !
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserTermsList;