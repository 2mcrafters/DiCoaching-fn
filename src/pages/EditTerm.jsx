import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSelector, useDispatch } from "react-redux";
import {
  selectAllTerms,
  selectTermById,
  fetchTerms,
  updateTerm,
} from "@/features/terms/termsSlice";
import SubmitFormSection from "@/components/submit/SubmitFormSection";
import { Save, Send, ArrowLeft, Loader2 } from "lucide-react";

const EditTerm = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const dispatch = useDispatch();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const terms = useSelector(selectAllTerms);
  const termFromStore = useSelector((state) =>
    selectAllTerms(state).find((t) => t.slug === slug)
  );

  useEffect(() => {
    if (!terms || terms.length === 0) {
      dispatch(fetchTerms());
      setLoading(true);
      return;
    }
    const termToEdit = termFromStore;
    if (termToEdit) {
      // Admin can edit all terms, Author can edit only their own terms
      const isAdmin = user.role === "admin";
      const isAuthor = user.role === "auteur" || user.role === "author";
      const isOwner = String(termToEdit.authorId) === String(user.id);
      const canEdit = isAdmin || (isAuthor && isOwner);

      if (canEdit) {
        setFormData({
          ...termToEdit,
          category: "Coaching",
          exemples:
            termToEdit.exemples && termToEdit.exemples.length > 0
              ? termToEdit.exemples
              : [{ text: "" }],
          sources:
            termToEdit.sources && termToEdit.sources.length > 0
              ? termToEdit.sources
              : [{ text: "" }],
          remarques:
            termToEdit.remarques && termToEdit.remarques.length > 0
              ? termToEdit.remarques
              : [{ text: "" }],
          moderatorComment: termToEdit.moderatorComment || "",
        });
      } else {
        toast({
          title: "Accès non autorisé",
          description:
            "Vous n'avez pas la permission de modifier ce terme directement. Veuillez proposer une modification.",
          variant: "destructive",
        });
        navigate(`/propose-modification/${slug}`);
      }
    } else {
      toast({
        title: "Terme non trouvé",
        description: "Le terme que vous essayez de modifier n'existe pas.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
    setLoading(false);
  }, [slug, user, navigate, toast, terms, termFromStore, dispatch]);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  };

  const handleFormAction = async (newStatus) => {
    if (
      !formData.term?.trim() ||
      (newStatus !== "draft" &&
        (!formData.category || !formData.definition?.trim()))
    ) {
      toast({
        title: "Erreur",
        description:
          newStatus !== "draft"
            ? "Veuillez remplir au minimum le titre, la catégorie et la définition."
            : "Le titre est requis pour sauvegarder un brouillon.",
        variant: "destructive",
      });
      return;
    }

    const finalStatus =
      user.role === "auteur" || user.role === "admin" ? "published" : newStatus;

    const updatedTermData = {
      terme: formData.term,
      definition: formData.definition,
      categorie_id: formData.categorie_id || 1,
      exemples: formData.exemples.filter((ex) => ex.text?.trim()),
      sources: formData.sources.filter((res) => res.text?.trim()),
      remarques: (formData.remarques || []).filter((r) => r.text?.trim()),
      status: finalStatus,
      author_id: formData.authorId || user.id,
    };

    try {
      setLoading(true);
      // Save to backend via Redux thunk
      await dispatch(
        updateTerm({ id: formData.id, changes: updatedTermData })
      ).unwrap();

      toast({
        title:
          finalStatus === "published"
            ? "Terme publié !"
            : "Modifications sauvegardées !",
        description:
          finalStatus === "published"
            ? "Vos modifications ont été publiées."
            : "Vos modifications ont été sauvegardées en tant que brouillon.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !formData) {
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
          {formData.term ? `Modifier: ${formData.term}` : "Modifier un terme"} -
          Dictionnaire Collaboratif
        </title>
        <meta
          name="description"
          content={`Modifiez la fiche du terme ${formData.term}.`}
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
                Retour à la fiche
              </Link>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Modifier le terme
              </h1>
              <p className="text-muted-foreground">
                Apportez vos améliorations à la fiche "{formData.term}"
              </p>
            </div>

            <div className="space-y-8">
              <SubmitFormSection
                formData={formData}
                setFormData={setFormData}
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleFormAction("draft")}
                  className="flex-1 sm:flex-none"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder en brouillon
                </Button>
                <Button
                  onClick={() => handleFormAction("published")}
                  className="flex-1 sm:flex-none"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publier les modifications
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default EditTerm;