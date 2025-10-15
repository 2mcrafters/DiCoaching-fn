import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  WifiOff, 
  RefreshCw,
  Home,
  Signal,
  ServerCrash
} from 'lucide-react';

const NetworkError = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isChecking, setIsChecking] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/ping', { method: 'HEAD' });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Still offline');
    } finally {
      setTimeout(() => setIsChecking(false), 1000);
    }
  };

  return (
    <>
      <Helmet>
        <title>Erreur de connexion | Dictionnaire Collaboratif</title>
        <meta name="description" content="Problème de connexion réseau détecté." />
      </Helmet>

      <div className="min-h-screen creative-bg flex items-center justify-center p-4">
        <div className="max-w-2xl w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Animated Icon */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="relative"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
                  <WifiOff className="h-32 w-32 text-amber-500 relative z-10" />
                  
                  {/* Animated signal waves */}
                  <motion.div
                    className="absolute top-0 right-0"
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Signal className="h-12 w-12 text-amber-400" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Status Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 mb-4 ${
                isOnline 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                  : 'border-red-500 bg-red-50 dark:bg-red-950/20'
              }`}>
                <motion.div
                  className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <span className={`font-medium ${isOnline ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {isOnline ? 'Connexion rétablie' : 'Hors ligne'}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Problème de connexion
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                {isOnline 
                  ? "Votre connexion semble rétablie. Vous pouvez réessayer de charger la page."
                  : "Impossible de se connecter au serveur. Veuillez vérifier votre connexion Internet."
                }
              </p>
            </motion.div>

            {/* Tips Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-background/80 backdrop-blur-lg rounded-2xl shadow-xl border border-border/60 p-8 mb-8"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
                <ServerCrash className="h-5 w-5" />
                Que faire ?
              </h3>
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez que votre appareil est bien connecté à Internet
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Essayez de désactiver puis réactiver le Wi-Fi ou les données mobiles
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez que le serveur n'est pas en maintenance
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Si le problème persiste, contactez votre administrateur réseau
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Button
                onClick={handleRetry}
                disabled={isChecking}
                size="lg"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Vérification...' : 'Réessayer'}
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Recharger la page
              </Button>

              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Page d'accueil
              </Button>
            </motion.div>

            {/* Auto-reload notice */}
            {isOnline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-sm text-muted-foreground"
              >
                ✓ Connexion rétablie ! La page se rechargera automatiquement...
              </motion.p>
            )}
          </motion.div>

          {/* Animated Background Elements */}
          <motion.div
            className="absolute top-1/4 left-10 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -z-10"
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

export default NetworkError;
