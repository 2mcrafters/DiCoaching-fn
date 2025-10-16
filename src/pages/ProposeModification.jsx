import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import SubmitFormSection from "@/components/submit/SubmitFormSection";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { createModification } from "@/features/modifications/modificationsSlice";

const ProposeModification = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { terms, loading: dataLoading } = useData();

  const [originalTerm, setOriginalTerm] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (dataLoading) return;

    const termToEdit = terms.find((t) => t.slug === slug);

    if (termToEdit) {
      setOriginalTerm(termToEdit);
      setFormData({
        ...termToEdit,
        examples:
          termToEdit.examples && termToEdit.examples.length > 0
            ? termToEdit.examples
            : [{ text: "" }],
        sources:
          termToEdit.sources && termToEdit.sources.length > 0
            ? termToEdit.sources
            : [{ text: "" }],
        moderatorComment: "",
      });
    } else {
      toast({
        title: "Terme non trouve",
        description:
          "Le terme selectionne est introuvable. Retour au tableau de bord.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
    setLoading(false);
  }, [slug, navigate, toast, terms, dataLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const getChanges = () => {
    if (!originalTerm || !formData) return {};
    const changes = {};
    Object.keys(formData).forEach((key) => {
      if (key in originalTerm) {
        const originalValue = JSON.stringify(originalTerm[key]);
        const newValue = JSON.stringify(formData[key]);
        if (originalValue !== newValue && key !== "moderatorComment") {
          changes[key] = formData[key];
        }
      }
    });
    return changes;
  };

  const handleProposeModification = async () => {
    const changes = getChanges();
    if (Object.keys(changes).length === 0) {
      toast({
        title: "Aucune modification",
        description: "Vous n'avez propose aucun changement.",
        variant: "default",
      });
      return;
    }

    try {
      setSubmitting(true);
      const modificationData = {
        term_id: originalTerm.id,
        changes,
        comment: formData.moderatorComment,
      };

      await dispatch(createModification(modificationData)).unwrap();

      toast({
        title: "Modification envoyee",
        description:
          "Votre proposition a ete transmise aux moderateurs. Merci pour votre contribution !",
      });

      navigate(`/fiche/${slug}`);
    } catch (error) {
      console.error("Erreur lors de la proposition de modification:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible de soumettre votre proposition. Veuillez reessayer.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || dataLoading || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-32 w-32 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {formData.term
            ? `Proposer une modification pour: ${formData.term}`
            : "Proposer une modification"}
        </title>
        <meta
          name="description"
          content={`Proposez des ameliorations pour la fiche du terme ${formData.term}.`}
        />
      </Helmet>

      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <Link
                to={`/fiche/${slug}`}
                className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour a la fiche
              </Link>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Proposer une modification
              </h1>
              <p className="text-muted-foreground">
                Suggerez des ameliorations pour la fiche "{formData.term}"
              </p>
            </div>

            <div className="space-y-8">
              <SubmitFormSection
                formData={formData}
                setFormData={setFormData}
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button
                  onClick={handleProposeModification}
                  className="flex-1 sm:flex-none"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {submitting
                    ? "Envoi en cours..."
                    : "Soumettre la proposition"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ProposeModification;
