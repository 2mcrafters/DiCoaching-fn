import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ServerCrash, Home, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ServerError = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Background blob animation variants
  const blobVariants = {
    animate: {
      x: [0, 30, 0],
      y: [0, -30, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>500 - Erreur Serveur | DictCoaching</title>
        <meta
          name="description"
          content="Une erreur serveur s'est produite. Nos équipes travaillent à résoudre le problème."
        />
      </Helmet>

      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted px-4 py-8">
        {/* Animated background blobs */}
        <motion.div
          variants={blobVariants}
          animate="animate"
          className="absolute top-20 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"
        />
        <motion.div
          variants={blobVariants}
          animate="animate"
          style={{ animationDelay: "2s" }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
        />
        <motion.div
          variants={blobVariants}
          animate="animate"
          style={{ animationDelay: "4s" }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl"
        />

        {/* Main content */}
        <div className="relative z-10 max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-8"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className="flex justify-center relative"
            >
              <div className="relative">
                <ServerCrash className="h-32 w-32 text-red-500" strokeWidth={1.5} />
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                  className="absolute -top-2 -right-2"
                >
                  <AlertTriangle className="h-10 w-10 text-orange-500" />
                </motion.div>
              </div>
            </motion.div>

            {/* Error code */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.h1
                className="text-[140px] sm:text-[180px] md:text-[200px] font-black leading-none bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                500
              </motion.h1>
            </motion.div>

            {/* Title and description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-xl" />
                <h2 className="relative text-3xl md:text-4xl font-bold text-foreground">
                  Erreur Serveur
                </h2>
              </div>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Oups ! Quelque chose s'est mal passé sur nos serveurs. 
                Nos équipes techniques sont déjà au courant et travaillent à résoudre le problème.
              </p>
            </motion.div>

            {/* Info card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 blur-xl rounded-2xl" />
              <div className="relative backdrop-blur-sm bg-card/50 border border-border/50 rounded-2xl p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-lg mb-3 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Que faire ?
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Rechargez la page dans quelques instants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Vérifiez votre connexion internet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Si le problème persiste, contactez le support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Revenez à l'accueil et essayez une autre page</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                onClick={handleReload}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Recharger la page
              </Button>

              <Button
                onClick={handleGoBack}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Retour
              </Button>

              <Button
                onClick={handleGoHome}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Home className="h-5 w-5 mr-2" />
                Accueil
              </Button>
            </motion.div>

            {/* Help text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-muted-foreground"
            >
              Code d'erreur : <span className="font-mono font-semibold text-red-500">500</span> - Internal Server Error
            </motion.p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ServerError;
