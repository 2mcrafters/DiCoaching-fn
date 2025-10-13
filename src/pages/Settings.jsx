import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";

const Settings = () => {
  return (
    <>
      <Helmet>
        <title>Paramètres - Dictionnaire du Coaching</title>
        <meta name="description" content="Gérez vos paramètres de compte." />
      </Helmet>
      <div className="min-h-screen creative-bg">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-8">
              Paramètres
            </h1>

            <div className="py-8">
              <p className="text-muted-foreground">
                Aucune option de notification n'est disponible. Les paramètres
                de notifications ont été supprimés.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Settings;
