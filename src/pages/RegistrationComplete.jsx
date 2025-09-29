import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';

const RegistrationComplete = () => {
  return (
    <>
      <Helmet>
        <title>Candidature envoyée - Dictionnaire Collaboratif</title>
        <meta name="description" content="Confirmation de la soumission de votre candidature pour devenir auteur." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="text-center shadow-xl">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <MailCheck className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="mt-4 text-2xl font-bold">Candidature envoyée !</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                Merci d'avoir postulé pour devenir auteur.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-6">
                Votre candidature est en cours de validation par notre équipe. Vous serez notifié par email une fois votre profil approuvé. Cela peut prendre quelques jours.
              </p>
              <Link to="/">
                <Button>Retour à l'accueil</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default RegistrationComplete;