import React, { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Check,
  X,
  User,
  Calendar,
  AlertCircle,
  Edit,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import ReactMarkdown from "react-markdown";
import {
  fetchModificationById,
  reviewModification,
  selectModificationById,
  selectModificationDetailsLoading,
  selectModificationDetailsError,
} from "@/features/modifications/modificationsSlice";
import { updateTerm } from "@/features/terms/termsSlice";

const FALLBACK_PROPOSER_NAME = "Mohamed Rachid Belhadj";

const StructuredList = ({ items, className }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun element.</p>;
  }

  return (
    <div className={className}>
      {items.map((item, index) => {
        const value =
          typeof item === "string" ? { text: item } : item || { text: "" };
        const content =
          value.text ||
          value.value ||
          value.label ||
          JSON.stringify(value, null, 2);
        return (
          <Card
            key={`${index}-${content.slice(0, 10)}`}
            className="mb-2 p-3 bg-transparent border-none shadow-none"
          >
            <CardContent className="p-0 space-y-1">
              <p className="text-sm">{content}</p>
              {value.url ? (
                <a
                  href={value.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline break-all"
                >
                  {value.url}
                </a>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const DiffViewer = ({ title, oldContent, newContent }) => {
  const safeOld = oldContent ?? null;
  const safeNew = newContent ?? null;

  if (JSON.stringify(safeOld) === JSON.stringify(safeNew)) {
    return null;
  }

  const normalizedTitle = title.replace(/([A-Z])/g, " $1");
  const isCollectionField = ["examples", "sources", "remarques"].includes(
    title
  );

  const renderBlock = (content) => {
    if (isCollectionField) {
      return <StructuredList items={content} className="space-y-2" />;
    }

    if (typeof content === "string") {
      return <ReactMarkdown>{content || "Vide"}</ReactMarkdown>;
    }

    if (content === null || typeof content === "undefined") {
      return <p className="text-sm text-muted-foreground">Vide</p>;
    }

    return (
      <pre className="text-xs whitespace-pre-wrap break-words">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-lg mb-3 capitalize flex items-center gap-2">
        <span className="bg-primary/10 px-3 py-1 rounded-full text-primary">
          {normalizedTitle}
        </span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Old Version - Red Theme */}
        <div className="border-2 border-red-300 dark:border-red-700 p-4 rounded-lg bg-red-50/50 dark:bg-red-950/20 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <h4 className="font-bold text-red-700 dark:text-red-400">
              Ancienne version
            </h4>
          </div>
          <div className="prose prose-sm max-w-none text-red-900 dark:text-red-300">
            {renderBlock(safeOld)}
          </div>
        </div>

        {/* New Version - Green Theme */}
        <div className="border-2 border-green-300 dark:border-green-700 p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <h4 className="font-bold text-green-700 dark:text-green-400">
              Nouvelle version proposée
            </h4>
          </div>
          <div className="prose prose-sm max-w-none text-green-900 dark:text-green-300">
            {renderBlock(safeNew)}
          </div>
        </div>
      </div>
    </div>
  );
};

const sanitizeChanges = (changes) => {
  if (!changes || typeof changes !== "object") return {};
  const sanitized = { ...changes };

  const cleanCollection = (value) =>
    Array.isArray(value)
      ? value
          .map((item) =>
            typeof item === "string" ? { text: item } : item || {}
          )
          .filter((item) => (item.text || item.url || "").toString().trim())
      : value;

  if (sanitized.examples) {
    sanitized.examples = cleanCollection(sanitized.examples);
  }
  if (sanitized.sources) {
    sanitized.sources = cleanCollection(sanitized.sources);
  }
  if (sanitized.remarques) {
    sanitized.remarques = cleanCollection(sanitized.remarques);
  }

  return sanitized;
};

const ModificationDetails = () => {
  const { id } = useParams();
  const { user, hasAuthorPermissions } = useAuth();
  const { terms, refreshData, loading: termsLoading } = useData();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const modification = useSelector((state) =>
    selectModificationById(state, id)
  );
  const detailsLoading = useSelector(selectModificationDetailsLoading);
  const detailsError = useSelector(selectModificationDetailsError);

  useEffect(() => {
    if (!user) return;
    if (!modification && !detailsLoading) {
      dispatch(fetchModificationById(id));
    }
  }, [dispatch, id, user?.id, modification, detailsLoading]);

  const termMap = useMemo(() => {
    if (!Array.isArray(terms)) return {};
    return terms.reduce((acc, term) => {
      const key = String(term.id ?? term._id ?? "");
      if (key) acc[key] = term;
      return acc;
    }, {});
  }, [terms]);

  const originalTerm = useMemo(() => {
    if (!modification) return null;
    const key = String(modification.termId ?? "");
    return termMap[key] || null;
  }, [modification, termMap]);

  const proposerFirstName =
    modification?.proposerFirstName || modification?.proposer_firstname || "";
  const proposerLastName =
    modification?.proposerLastName || modification?.proposer_lastname || "";
  const proposerName =
    modification?.proposerName ||
    `${proposerFirstName} ${proposerLastName}`.trim() ||
    FALLBACK_PROPOSER_NAME;

  const createdAtLabel = modification?.createdAt
    ? new Date(modification.createdAt).toLocaleString("fr-FR")
    : null;

  const termSlug =
    modification?.termSlug ||
    originalTerm?.slug ||
    originalTerm?.term_slug ||
    null;

  const termTitle =
    modification?.termTitle || originalTerm?.term || "Terme inconnu";

  const canReview =
    user &&
    ((typeof hasAuthorPermissions === "function" && hasAuthorPermissions()) ||
      user.role === "admin") &&
    modification?.status === "pending";

  const handleAction = async (action) => {
    if (!modification) return;

    try {
      if (action === "approve") {
        const changesPayload = sanitizeChanges(modification.changes);
        if (!modification.termId) {
          throw new Error(
            "Identifiant de terme manquant pour appliquer la modification."
          );
        }
        await dispatch(
          updateTerm({ id: modification.termId, changes: changesPayload })
        ).unwrap();

        await dispatch(
          reviewModification({ id: modification.id, status: "approved" })
        ).unwrap();

        toast({
          title: "Modification approuvee",
          description:
            "Le terme a ete mis a jour et la proposition est marquee comme appliquee.",
        });
        if (typeof refreshData === "function") {
          refreshData();
        }
      } else {
        await dispatch(
          reviewModification({ id: modification.id, status: "rejected" })
        ).unwrap();
        toast({
          title: "Modification rejetee",
          description: "La proposition a ete marquee comme rejetee.",
        });
      }

      navigate("/modifications");
    } catch (error) {
      console.error("Erreur lors du traitement de la modification:", error);
      toast({
        title: "Erreur",
        description:
          error?.message ||
          "Impossible de traiter la proposition. Veuillez reessayer.",
        variant: "destructive",
      });
    }
  };

  const isLoading = detailsLoading || (!modification && termsLoading);

  if (isLoading) {
    return <div className="text-center py-20">Chargement des details...</div>;
  }

  if (detailsError && !modification) {
    return (
      <div className="text-center py-20 text-destructive space-y-3">
        <AlertCircle className="inline h-6 w-6" />
        <p>{detailsError}</p>
      </div>
    );
  }

  if (!modification) {
    return (
      <div className="text-center py-20">
        Modification introuvable ou deja traitee.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {termTitle
            ? `Details de la Modification - ${termTitle}`
            : "Details de la Modification"}
        </title>
        <meta
          name="description"
          content={`Details de la modification proposee pour le terme ${termTitle}.`}
        />
      </Helmet>
      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Edit className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      Modification proposée pour:{" "}
                      {termSlug ? (
                        <Link
                          to={`/fiche/${termSlug}`}
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {termTitle}
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="text-primary">{termTitle}</span>
                      )}
                    </CardTitle>
                    <CardDescription className="flex flex-col gap-2 pt-2 md:flex-row md:items-center md:gap-4">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" /> Proposé par :{" "}
                        {proposerName}
                      </span>
                      {createdAtLabel ? (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" /> Le{" "}
                          {createdAtLabel}
                        </span>
                      ) : null}
                      <Badge
                        variant={
                          modification.status === "approved"
                            ? "success"
                            : modification.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                        className="w-fit"
                      >
                        {modification.status === "approved"
                          ? "Approuvée"
                          : modification.status === "rejected"
                          ? "Rejetée"
                          : "En attente"}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {Object.keys(modification.changes || {}).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun changement detecte dans cette proposition.
                  </p>
                ) : (
                  Object.entries(modification.changes).map(([key, value]) => (
                    <DiffViewer
                      key={key}
                      title={key}
                      oldContent={originalTerm?.[key]}
                      newContent={value}
                    />
                  ))
                )}

                {modification.comment ? (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Commentaire du contributeur
                    </h3>
                    <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20 text-sm whitespace-pre-wrap">
                      {modification.comment}
                    </div>
                  </div>
                ) : null}

                {modification.adminComment ? (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      Commentaire de modération
                    </h3>
                    <div className="border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50/50 dark:bg-amber-950/20 text-sm whitespace-pre-wrap">
                      {modification.adminComment}
                    </div>
                  </div>
                ) : null}

                {canReview ? (
                  <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-6 border-t-2">
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => handleAction("reject")}
                      className="sm:w-auto w-full"
                    >
                      <X className="mr-2 h-5 w-5" /> Rejeter la modification
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => handleAction("approve")}
                      className="sm:w-auto w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="mr-2 h-5 w-5" /> Approuver et appliquer
                    </Button>
                  </div>
                ) : (
                  <div className="mt-8 pt-6 border-t-2 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg text-muted-foreground">
                      <AlertCircle className="h-5 w-5" />
                      <span>
                        {modification.status === "pending"
                          ? "Seuls les administrateurs et auteurs peuvent valider cette proposition."
                          : "Cette modification a déjà été traitée."}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ModificationDetails;
