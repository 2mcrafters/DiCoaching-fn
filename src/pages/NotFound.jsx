import React from 'react';
    import { Helmet } from 'react-helmet';
    import { Link } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Frown } from 'lucide-react';

    const NotFoundPage = () => {
      return (
        <>
          <Helmet>
            <title>404 - Page non trouvée</title>
          </Helmet>
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16 creative-bg">
            <Frown className="h-24 w-24 text-primary mb-4" />
            <h1 className="text-9xl font-bold creative-gradient-text">404</h1>
            <p className="text-2xl font-semibold mt-4 text-foreground">Oops! Page non trouvée.</p>
            <p className="mt-4 text-lg text-muted-foreground">
              La page que vous cherchez n'existe pas ou a été déplacée.
            </p>
            <Link to="/" className="mt-8 inline-block">
              <Button>Retour à l'accueil</Button>
            </Link>
          </div>
        </>
      );
    };

    export default NotFoundPage;