import React from 'react';
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Home,
  Search,
  ArrowLeft,
  FileQuestion,
  BookOpen,
  Compass,
} from "lucide-react";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `/dictionnaire?search=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  const popularPages = [
    { name: "Accueil", path: "/", icon: Home },
    { name: "Dictionnaire", path: "/dictionnaire", icon: BookOpen },
    { name: "Auteurs", path: "/auteurs", icon: Compass },
  ];

  return (
    <>
      <Helmet>
        <title>404 - Page non trouvée | Dictionnaire Collaboratif</title>
        <meta
          name="description"
          content="La page que vous recherchez n'existe pas."
        />
      </Helmet>

      <div className="min-h-screen creative-bg flex items-center justify-center p-4 overflow-hidden">
        <div className="max-w-4xl w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Animated 404 Number */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.8,
                type: "spring",
                stiffness: 100,
              }}
            >
              <div className="relative inline-block">
                <motion.h1
                  className="text-[140px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 leading-none"
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
                  404
                </motion.h1>

                <motion.div
                  className="absolute -top-10 -right-10"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 10, 0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <FileQuestion className="h-16 w-16 text-purple-500" />
                </motion.div>
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Page introuvable
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
                Oups ! La page que vous recherchez semble avoir disparu dans les
                méandres du dictionnaire.
              </p>
              <p className="text-muted-foreground">
                Il se peut que le lien soit incorrect ou que la page ait été
                déplacée.
              </p>
            </motion.div>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12 max-w-2xl mx-auto"
            >
              <div className="bg-background/80 backdrop-blur-lg rounded-2xl shadow-xl border border-border/60 p-6">
                <p className="text-sm font-medium text-foreground mb-4 flex items-center justify-center gap-2">
                  <Search className="h-4 w-4" />
                  Recherchez un terme dans le dictionnaire
                </p>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex: Aboulie, Sérendipité..."
                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button type="submit" size="lg" className="px-6">
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
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
            </motion.div>

            {/* Popular Pages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-background/60 backdrop-blur-lg rounded-2xl shadow-xl border border-border/60 p-8 max-w-3xl mx-auto"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Pages populaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {popularPages.map((page, index) => (
                  <motion.button
                    key={page.path}
                    onClick={() => navigate(page.path)}
                    className="group relative bg-background hover:bg-muted rounded-xl p-6 border border-border hover:border-primary transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  >
                    <page.icon className="h-8 w-8 text-primary mb-3 mx-auto" />
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {page.name}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Animated Background Elements */}
          <motion.div
            className="absolute top-1/4 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/3 right-20 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-pink-400/10 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;