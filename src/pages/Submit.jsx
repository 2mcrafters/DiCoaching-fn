import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useData } from "@/contexts/DataContext";
import SubmitFormSection from "@/components/submit/SubmitFormSection";
import { Save, Send } from "lucide-react";

const Submit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { terms, setTerms } = useData();

  const [formData, setFormData] = useState({
    term: "",
    category: "Coaching", // Default to Coaching
    definition: "",
    exemples: [{ text: "" }],
    sources: [{ text: "" }],
    moderatorComment: "",
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      let completed = 0;
      const total = 5;
      if (formData.term?.trim()) completed++;
      if (formData.category) completed++;
      if (formData.definition?.trim()) completed++;
      if (formData.exemples.some((ex) => ex.text?.trim())) completed++;
      if (formData.sources.some((res) => res.text?.trim())) completed++;
      setProgress((completed / total) * 100);
    };
    calculateProgress();
  }, [formData]);

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

  const handleFormAction = (status) => {
    if (
      !formData.term?.trim() ||
      (status !== "draft" &&
        (!formData.category || !formData.definition?.trim()))
    ) {
      toast({
        title: "Erreur",
        description:
          status !== "draft"
            ? "Veuillez remplir au minimum le titre, la catégorie et la définition."
            : "Le titre est requis pour sauvegarder un brouillon.",
        variant: "destructive",
      });
      return;
    }

    const finalStatus =
      user.role === "auteur" || user.role === "admin" ? "published" : status;

    const newTerm = {
      id: `term-${Date.now()}`,
      term: formData.term,
      slug: generateSlug(formData.term),
      category: "Coaching", // Enforce Coaching category
      definition: formData.definition,
      exemples: formData.exemples.filter((ex) => ex.text?.trim()),
      sources: formData.sources.filter((res) => res.text?.trim()),
      status: finalStatus,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
    };

    // update the shared data context (single source of truth - backend)
    setTerms((prev) => {
      const next = Array.isArray(prev) ? [...prev, newTerm] : [newTerm];
      return next;
    });

    toast({
      title:
        finalStatus === "published"
          ? "Terme publié !"
          : "Brouillon sauvegardé !",
      description:
        finalStatus === "published"
          ? "Votre terme a été ajouté au dictionnaire."
          : "Votre brouillon a été sauvegardé. Vous pourrez le retrouver sur votre tableau de bord.",
    });

    navigate("/dashboard");
  };

  return (
    <>
      <Helmet>
        <title>Soumettre un terme - Dictionnaire Collaboratif</title>
        <meta
          name="description"
          content="Ajoutez un nouveau terme au dictionnaire collaboratif du coaching."
        />
      </Helmet>

      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Soumettre un nouveau terme
              </h1>
              <p className="text-muted-foreground">
                Partagez vos connaissances avec la communauté du coaching
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Progression</CardTitle>
                <CardDescription>
                  Complétez les champs pour améliorer la qualité de votre
                  contribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{Math.round(progress)}% complété</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </CardContent>
            </Card>

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
                  Publier directement
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Submit;