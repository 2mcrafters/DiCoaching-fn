import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SubmitFormSection from '@/components/submit/SubmitFormSection';
import { Save, Send, ArrowLeft, Loader2 } from 'lucide-react';

const EditTerm = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allTerms = JSON.parse(localStorage.getItem('coaching_dict_terms') || '[]');
    const termToEdit = allTerms.find(t => t.slug === slug);

    if (termToEdit) {
      if (user.role === 'admin' || user.role === 'auteur') {
        setFormData({
          ...termToEdit,
          // Ensure category is "Coaching" for consistency
          category: 'Coaching',
          exemples: (termToEdit.exemples && termToEdit.exemples.length > 0) ? termToEdit.exemples : [{ text: '' }],
          sources: (termToEdit.sources && termToEdit.sources.length > 0) ? termToEdit.sources : [{ text: '' }],
          moderatorComment: termToEdit.moderatorComment || '',
        });
      } else {
        toast({ title: "Accès non autorisé", description: "Vous n'avez pas la permission de modifier ce terme directement. Veuillez proposer une modification.", variant: "destructive" });
        navigate(`/propose-modification/${slug}`);
      }
    } else {
      toast({ title: "Terme non trouvé", description: "Le terme que vous essayez de modifier n'existe pas.", variant: "destructive" });
      navigate('/dashboard');
    }
    setLoading(false);
  }, [slug, user, navigate, toast]);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const handleFormAction = (newStatus) => {
    if (!formData.term?.trim() || (newStatus !== 'draft' && (!formData.category || !formData.definition?.trim()))) {
      toast({
        title: "Erreur",
        description: newStatus !== 'draft'
          ? "Veuillez remplir au minimum le titre, la catégorie et la définition."
          : "Le titre est requis pour sauvegarder un brouillon.",
        variant: "destructive",
      });
      return;
    }

    const finalStatus = (user.role === 'auteur' || user.role === 'admin') ? 'published' : newStatus;

    const updatedTermData = {
      ...formData,
      slug: generateSlug(formData.term),
      // Ensure category remains "Coaching" upon save
      category: 'Coaching',
      exemples: formData.exemples.filter(ex => ex.text?.trim()),
      sources: formData.sources.filter(res => res.text?.trim()),
      status: finalStatus,
      updatedAt: new Date().toISOString(),
    };

    const existingTerms = JSON.parse(localStorage.getItem('coaching_dict_terms') || '[]');
    const updatedTerms = existingTerms.map(t => t.id === formData.id ? updatedTermData : t);
    localStorage.setItem('coaching_dict_terms', JSON.stringify(updatedTerms));

    toast({
      title: finalStatus === 'published' ? "Terme publié !" : "Modifications sauvegardées !",
      description: finalStatus === 'published' ? "Vos modifications ont été publiées." : "Vos modifications ont été sauvegardées en tant que brouillon.",
    });

    navigate('/dashboard');
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
        <title>{formData.term ? `Modifier: ${formData.term}` : "Modifier un terme"} - Dictionnaire Collaboratif</title>
        <meta name="description" content={`Modifiez la fiche du terme ${formData.term}.`} />
      </Helmet>

      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <Link to={`/fiche/${slug}`} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la fiche
              </Link>
              <h1 className="text-3xl font-bold text-foreground mb-2">Modifier le terme</h1>
              <p className="text-muted-foreground">Apportez vos améliorations à la fiche "{formData.term}"</p>
            </div>

            <div className="space-y-8">
              <SubmitFormSection formData={formData} setFormData={setFormData} />
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button variant="outline" onClick={() => handleFormAction('draft')} className="flex-1 sm:flex-none">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder en brouillon
                </Button>
                <Button onClick={() => handleFormAction('published')} className="flex-1 sm:flex-none">
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