import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BookUser, PenSquare } from 'lucide-react';

const Step2RoleChoice = ({ formData, setFormData, onNext, onBack }) => {
  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
    onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Étape 2: Quel sera votre rôle ?</h2>
      <p className="text-center text-muted-foreground">Choisissez comment vous souhaitez participer au dictionnaire.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div whileHover={{ y: -5 }}>
          <Card 
            className="h-full cursor-pointer hover:border-purple-500 transition-all"
            onClick={() => handleRoleSelect('chercheur')}
          >
            <CardHeader className="items-center text-center">
              <BookUser className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Chercheur / Utilisateur</CardTitle>
              <CardDescription>Explorez, commentez et proposez des améliorations.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">Choisir ce rôle</Button>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -5 }}>
          <Card 
            className="h-full cursor-pointer hover:border-purple-500 transition-all"
            onClick={() => handleRoleSelect('auteur')}
          >
            <CardHeader className="items-center text-center">
              <PenSquare className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Auteur / Contributeur</CardTitle>
              <CardDescription>Publiez et éditez directement des termes (profil vérifié).</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">Choisir ce rôle</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Précédent</Button>
      </div>
    </div>
  );
};

export default Step2RoleChoice;