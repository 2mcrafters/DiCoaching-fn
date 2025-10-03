import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Check, X, User, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import ReactMarkdown from 'react-markdown';

const ExamplesViewer = ({ examples, className }) => (
    <div className={className}>
        {examples && examples.length > 0 ? (
            examples.map((ex, index) => (
                <Card key={index} className="mb-2 p-3 bg-transparent border-none shadow-none">
                    <CardContent className="p-0">
                        <p className="text-sm">{ex.text}</p>
                    </CardContent>
                </Card>
            ))
        ) : (
            <p className="text-sm text-muted-foreground">Aucun exemple.</p>
        )}
    </div>
);

const DiffViewer = ({ title, oldContent, newContent }) => {
  if (JSON.stringify(oldContent) === JSON.stringify(newContent)) return null;

  const isExamples = title === 'examples' || title === 'sources';

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-lg mb-2 capitalize">{title.replace(/([A-Z])/g, ' $1')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 rounded-md bg-red-500/10">
          <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">Ancienne version</h4>
          <div className="prose prose-sm max-w-none text-red-900 dark:text-red-300">
            {isExamples ? (
                <ExamplesViewer examples={oldContent} className="text-red-900 dark:text-red-300"/>
            ) : typeof oldContent === 'string' ? (
                <ReactMarkdown>{oldContent || 'Vide'}</ReactMarkdown>
            ) : (
                <pre>{JSON.stringify(oldContent, null, 2)}</pre>
            )}
          </div>
        </div>
        <div className="border p-4 rounded-md bg-green-500/10">
          <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">Nouvelle version</h4>
          <div className="prose prose-sm max-w-none text-green-900 dark:text-green-300">
            {isExamples ? (
                <ExamplesViewer examples={newContent} className="text-green-900 dark:text-green-300"/>
            ) : typeof newContent === 'string' ? (
                <ReactMarkdown>{newContent || 'Vide'}</ReactMarkdown>
            ) : (
                <pre>{JSON.stringify(newContent, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const ModificationDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshData, terms, setTerms } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modification, setModification] = useState(null);
  const [originalTerm, setOriginalTerm] = useState(null);
  const [proposer, setProposer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allModifications = JSON.parse(
      localStorage.getItem("coaching_dict_modifications") || "[]"
    );
    const mod = allModifications.find((m) => m.id === id);

    if (mod) {
      setModification(mod);
      const term = (terms || []).find((t) => t.id === mod.termId);
      setOriginalTerm(term);

      const allUsers = JSON.parse(
        localStorage.getItem("coaching_dict_users") || "[]"
      );
      const propUser = allUsers.find((u) => u.id === mod.proposerId);
      setProposer(propUser);
    }
    setLoading(false);
  }, [id]);

  const handleAction = (action) => {
    if (!modification) return;

    if (action === "approve") {
      // Apply changes to the in-memory terms and let the DataContext persist or caller refresh
      setTerms((prev) =>
        (prev || []).map((term) => {
          if (term.id === modification.termId) {
            const finalChanges = { ...modification.changes };
            if (finalChanges.examples) {
              finalChanges.examples = Array.isArray(finalChanges.examples)
                ? finalChanges.examples.filter((e) => e.text?.trim())
                : [];
            }
            if (finalChanges.sources) {
              finalChanges.sources = Array.isArray(finalChanges.sources)
                ? finalChanges.sources.filter((s) => s.text?.trim())
                : [];
            }
            return {
              ...term,
              ...finalChanges,
              updatedAt: new Date().toISOString(),
            };
          }
          return term;
        })
      );
      // trigger a refresh to be safe (DataContext may re-fetch from backend)
      if (typeof refreshData === "function") refreshData();
    }

    const allModifications = JSON.parse(
      localStorage.getItem("coaching_dict_modifications") || "[]"
    );
    const updatedModifications = allModifications.map((m) =>
      m.id === id
        ? {
            ...m,
            status: action === "approve" ? "approved" : "rejected",
            reviewerId: user.id,
          }
        : m
    );
    localStorage.setItem(
      "coaching_dict_modifications",
      JSON.stringify(updatedModifications)
    );

    toast({
      title: "Action effectuée",
      description: `La modification a été ${
        action === "approve" ? "approuvée et appliquée" : "rejetée"
      }.`,
    });
    navigate("/modifications");
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        Chargement des détails de la modification...
      </div>
    );
  }

  if (!modification || !originalTerm) {
    return <div className="text-center py-20">Modification non trouvée.</div>;
  }

  const canReview =
    (user.role === "admin" || user.role === "auteur") &&
    modification.status === "pending";

  return (
    <>
      <Helmet>
        <title>
          {modification?.termTitle
            ? `Détails de la Modification - ${modification.termTitle}`
            : "Détails de la Modification"}
        </title>
        <meta
          name="description"
          content={`Détails de la modification proposée pour le terme ${modification.termTitle}.`}
        />
      </Helmet>
      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <CardHeader>
                <CardTitle className="text-2xl">
                  Modification pour:{" "}
                  <Link
                    to={`/fiche/${modification.termSlug}`}
                    className="text-primary hover:underline"
                  >
                    {modification.termTitle}
                  </Link>
                </CardTitle>
                <CardDescription className="flex items-center gap-4 pt-2">
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" /> Proposé par:{" "}
                    {proposer?.name || "Mohamed Rachid Belhadj"}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" /> Le{" "}
                    {new Date(modification.createdAt).toLocaleString("fr-FR")}
                  </span>
                  <Badge
                    variant={
                      modification.status === "approved"
                        ? "success"
                        : modification.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {modification.status === "approved"
                      ? "Approuvée"
                      : modification.status === "rejected"
                      ? "Rejetée"
                      : "En attente"}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(modification.changes).map((key) => (
                  <DiffViewer
                    key={key}
                    title={key}
                    oldContent={originalTerm[key]}
                    newContent={modification.changes[key]}
                  />
                ))}

                {canReview ? (
                  <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={() => handleAction("reject")}
                    >
                      <X className="mr-2 h-4 w-4" /> Rejeter
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => handleAction("approve")}
                    >
                      <Check className="mr-2 h-4 w-4" /> Approuver et Appliquer
                    </Button>
                  </div>
                ) : (
                  <div className="mt-8 pt-4 border-t text-center text-muted-foreground">
                    {modification.status === "pending" ? (
                      <p>
                        Seuls les administrateurs et auteurs peuvent valider
                        cette proposition.
                      </p>
                    ) : (
                      <p>Cette modification a déjà été traitée.</p>
                    )}
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