import React, { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, User, Calendar, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  fetchModifications,
  selectAllModifications,
  selectModificationsLoading,
  selectModificationsError,
} from "@/features/modifications/modificationsSlice";

const FALLBACK_PROPOSER_NAME = "Mohamed Rachid Belhadj";

const Modifications = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { terms } = useData();
  const modifications = useSelector(selectAllModifications);
  const loading = useSelector(selectModificationsLoading);
  const error = useSelector(selectModificationsError);

  useEffect(() => {
    if (!user) return;
    dispatch(fetchModifications());
  }, [dispatch, user?.id]);

  const termsById = useMemo(() => {
    if (!Array.isArray(terms)) return {};
    return terms.reduce((acc, term) => {
      const key = String(term.id ?? term._id ?? "");
      if (key) acc[key] = term;
      return acc;
    }, {});
  }, [terms]);

  const filteredModifications = useMemo(() => {
    if (!user || !Array.isArray(modifications)) return [];
    const userId = String(user.id);
    if (user.role === "admin" || user.role === "auteur") {
      return modifications.filter((mod) => mod.status === "pending");
    }
    return modifications.filter(
      (mod) => mod.proposerId && String(mod.proposerId) === userId
    );
  }, [modifications, user]);

  const getUserName = (mod) => mod?.proposerName || FALLBACK_PROPOSER_NAME;

  const getStatusVariant = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Approuvee";
      case "rejected":
        return "Rejetee";
      default:
        return "En attente";
    }
  };

  const title =
    user.role === "admin" || user.role === "auteur"
      ? "Modifications en attente"
      : "Vos Propositions de Modification";

  const description =
    user.role === "admin" || user.role === "auteur"
      ? "Examinez les propositions d amelioration des termes en attente de validation."
      : "Suivez le statut de vos propositions de modification.";

  if (loading) {
    return (
      <>
        <Helmet>
          <title>{title} - Dictionnaire Collaboratif</title>
        </Helmet>
        <div className="min-h-screen creative-bg py-8">
          <div className="max-w-7xl mx-auto text-center py-20">
            Chargement des propositions...
          </div>
        </div>
      </>
    );
  }

  const hasError = Boolean(error);
  const hasModifications = filteredModifications.length > 0;

  return (
    <>
      <Helmet>
        <title>{title} - Dictionnaire Collaboratif</title>
        <meta name="description" content={description} />
      </Helmet>
      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
            {hasError && (
              <p className="mt-3 text-sm text-destructive">
                Impossible de charger les propositions : {error}
              </p>
            )}
          </motion.div>

          {!hasModifications ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg"
            >
              <Edit className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">
                {user.role === "admin" || user.role === "auteur"
                  ? "Aucune modification en attente."
                  : "Aucune proposition a afficher."}
              </h3>
              <p>
                {user.role === "admin" || user.role === "auteur"
                  ? "Toutes les propositions ont ete traitees."
                  : "Vous n'avez pas encore propose de modification."}
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredModifications.map((mod, index) => {
                const termKey = String(mod.termId ?? "");
                const term = termKey ? termsById[termKey] : null;
                const termTitle =
                  mod.termTitle || term?.term || "Terme inconnu";
                const termSlug = mod.termSlug || term?.slug || null;
                const createdAtLabel = mod.createdAt
                  ? new Date(mod.createdAt).toLocaleDateString("fr-FR")
                  : "Date inconnue";

                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <Card className="flex flex-col h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">
                            Modif #{mod.id.slice(-6)}
                          </CardTitle>
                          <Badge variant={getStatusVariant(mod.status)}>
                            {getStatusText(mod.status)}
                          </Badge>
                        </div>
                        <CardDescription>
                          Pour :{" "}
                          {termSlug ? (
                            <Link
                              to={`/fiche/${termSlug}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {termTitle}
                            </Link>
                          ) : (
                            <span className="text-foreground font-medium">
                              {termTitle}
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-3">
                        <p className="text-sm text-muted-foreground flex items-center">
                          <User className="inline h-4 w-4 mr-2" />
                          Propose par :{" "}
                          <span className="font-medium ml-1">
                            {getUserName(mod)}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="inline h-4 w-4 mr-2" />
                          Le {createdAtLabel}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <Link to={`/modifications/${mod.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> Voir les details
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modifications;
