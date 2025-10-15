import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, 
  Home, 
  ArrowLeft,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>403 - Accès refusé | Dictionnaire Collaboratif</title>
        <meta name="description" content="Vous n'avez pas les permissions nécessaires pour accéder à cette page." />
      </Helmet>

      <div className="min-h-screen creative-bg flex items-center justify-center p-4 overflow-hidden">
        <div className="max-w-3xl w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Animated Icon */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
            >
              <motion.div
                className="relative"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                  <ShieldAlert className="h-32 w-32 text-red-500 relative z-10" />
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Lock className="h-16 w-16 text-red-600" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Error Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-500">
                403
              </h1>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Accès refusé
              </h2>
              
              {user ? (
                <>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
                    Désolé, vous n'avez pas les permissions nécessaires pour accéder à cette page.
                  </p>
                  <p className="text-muted-foreground">
                    Cette section est réservée aux administrateurs ou aux utilisateurs avec des rôles spécifiques.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
                    Cette page nécessite une authentification.
                  </p>
                  <p className="text-muted-foreground">
                    Veuillez vous connecter pour accéder à ce contenu.
                  </p>
                </>
              )}
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-background/80 backdrop-blur-lg rounded-2xl shadow-xl border border-border/60 p-8 mb-8 max-w-2xl mx-auto"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Que puis-je faire ?
              </h3>
              <div className="space-y-3 text-left">
                {!user ? (
                  <>
                    <div className="flex items-start gap-3">
                      <LogIn className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Connectez-vous</p>
                        <p className="text-sm text-muted-foreground">
                          Si vous avez déjà un compte, connectez-vous pour accéder à votre contenu
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <UserPlus className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Créez un compte</p>
                        <p className="text-sm text-muted-foreground">
                          Inscrivez-vous gratuitement pour accéder aux fonctionnalités du dictionnaire
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <Home className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Retournez à l'accueil</p>
                        <p className="text-sm text-muted-foreground">
                          Explorez le dictionnaire et les sections accessibles à tous
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Demandez des autorisations</p>
                        <p className="text-sm text-muted-foreground">
                          Si vous pensez que vous devriez avoir accès, contactez un administrateur
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Page précédente
              </Button>

              <Button
                onClick={() => navigate("/")}
                size="lg"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Home className="h-4 w-4" />
                Retour à l'accueil
              </Button>

              {!user && (
                <Button
                  onClick={() => navigate("/connexion")}
                  size="lg"
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </Button>
              )}
            </motion.div>
          </motion.div>

          {/* Animated Background Elements */}
          <motion.div
            className="absolute top-1/4 left-10 w-32 h-32 bg-red-400/10 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-10 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Unauthorized;
