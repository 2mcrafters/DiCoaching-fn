import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle } from 'lucide-react';

const Step3AResearcher = ({ formData, setFormData, onBack, onSubmit, loading }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Finalisation de l'inscription</h2>
        <p className="text-muted-foreground">Vous y êtes presque !</p>
      </div>
      <div>
        <Label htmlFor="presentation">Dites-nous en quelques lignes pourquoi vous souhaitez rejoindre le dictionnaire (facultatif)</Label>
        <Textarea
          id="presentation"
          value={formData.presentation}
          onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
          placeholder="Vos motivations, vos centres d'intérêt..."
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>← Précédent</Button>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? 'Finalisation...' : 'Terminer l’inscription'}
        </Button>
      </div>
    </div>
  );
};

export default Step3AResearcher;