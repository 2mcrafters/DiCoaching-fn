import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from "lucide-react";

const Footer = () => {
  // Footer simplified: social icons and legal/contact sections removed

  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto py-12">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">
                <span style={{ color: "#884dee" }}>Di</span>
                <span className="text-black dark:text-white">coaching</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-base">
              La plateforme collaborative pour les professionnels du coaching.
            </p>
            {/* Social links removed */}
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Explorer
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link
                      to="/search"
                      className="text-base text-muted-foreground hover:text-foreground"
                    >
                      Recherche
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/authors"
                      className="text-base text-muted-foreground hover:text-foreground"
                    >
                      Auteurs
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/submit"
                      className="text-base text-muted-foreground hover:text-foreground"
                    >
                      Contribuer
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Compte
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link
                      to="/login"
                      className="text-base text-muted-foreground hover:text-foreground"
                    >
                      Connexion
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="text-base text-muted-foreground hover:text-foreground"
                    >
                      Inscription
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard"
                      className="text-base text-muted-foreground hover:text-foreground"
                    >
                      Tableau de bord
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            {/* Legal and Contact sections removed */}
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-base text-muted-foreground xl:text-center">
            &copy; {new Date().getFullYear()} Dicoaching - Dictionnaire
            Collaboratif du Coaching. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
