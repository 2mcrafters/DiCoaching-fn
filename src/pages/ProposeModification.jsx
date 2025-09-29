import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import SubmitFormSection from '@/components/submit/SubmitFormSection';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const ProposeModification = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { terms, loading: dataLoading } = useData();
  
  const [originalTerm, setOriginalTerm] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dataLoading) return;

    const termToEdit = terms.find(t => t.slug === slug);

    if (termToEdit) {
        setOriginalTerm(termToEdit);
        setFormData({
          ...termToEdit,
          examples: (termToEdit.examples && termToEdit.examples.length > 0) ? termToEdit.examples : [{ text: '' }],
          sources: (termToEdit.sources && termToEdit.sources.length > 0) ? termToEdit.sources : [{ text: '' }],
          moderatorComment: '',
        });
    } else {
      toast({ title: "Terme non trouvé", description: "Le terme pour lequel vous voulez proposer une modification n'existe pas.", variant: "destructive" });
      navigate('/dashboard');
    }
    setLoading(false);
  }, [slug, navigate, toast, terms, dataLoading]);

  const getChanges = () => {
    if (!originalTerm || !formData) return {};
    const changes = {};
    Object.keys(formData).forEach(key => {
        if (key in originalTerm) {
            const originalValue = JSON.stringify(originalTerm[key]);
            const newValue = JSON.stringify(formData[key]);
            if (originalValue !== newValue && key !== 'moderatorComment') {
                changes[key] = formData[key];
            }
        }
    });
    return changes;
  };

  const handleProposeModification = () => {
    const changes = getChanges();
    if (Object.keys(changes).length === 0) {
      toast({
        title: "Aucune modification",
        description: "Vous n'avez fait aucune modification à proposer.",
        variant: "default",
      });
      return;
    }

    const newModification = {
      id: `mod-${Date.now()}`,
      termId: originalTerm.id,
      termTitle: originalTerm.term,
      termSlug: originalTerm.slug,
      proposerId: user.id,
      changes: changes,
      comment: formData.moderatorComment,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const existingModifications = JSON.parse(localStorage.getItem('coaching_dict_modifications') || '[]');
    localStorage.setItem('coaching_dict_modifications', JSON.stringify([...existingModifications, newModification]));

    toast({
      title: "Modification proposée !",
      description: "Votre proposition a été envoyée aux modérateurs pour révision. Merci pour votre contribution !",
    });

    navigate(`/fiche/${slug}`);
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
        <title>{formData.term ? `Proposer une modification pour: ${formData.term}` : "Proposer une modification"}</title>
        <meta name="description" content={`Proposez des améliorations pour la fiche du terme ${formData.term}.`} />
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Proposer une modification</h1>
              <p className="text-muted-foreground">Suggérez des améliorations pour la fiche "{formData.term}"</p>
            </div>

            <div className="space-y-8">
              <SubmitFormSection formData={formData} setFormData={setFormData} />
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button onClick={handleProposeModification} className="flex-1 sm:flex-none">
                  <Send className="h-4 w-4 mr-2" />
                  Soumettre la proposition
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