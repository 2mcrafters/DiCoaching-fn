import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Twitter, Facebook, Linkedin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Footer = () => {
  const { toast } = useToast();

  const handleContactClick = () => {
    toast({
      title: "🚧 Cette fonctionnalité n'est pas encore implémentée",
      description: "Vous pouvez la demander dans votre prochaine requête ! 🚀",
    });
  };

  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl text-foreground">
                Dico<span className="creative-gradient-text">Coaching</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-base">
              La plateforme collaborative pour les professionnels du coaching.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Explorer</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link to="/search" className="text-base text-muted-foreground hover:text-foreground">Recherche</Link></li>
                  <li><Link to="/authors" className="text-base text-muted-foreground hover:text-foreground">Auteurs</Link></li>
                  <li><Link to="/submit" className="text-base text-muted-foreground hover:text-foreground">Contribuer</Link></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Compte</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link to="/login" className="text-base text-muted-foreground hover:text-foreground">Connexion</Link></li>
                  <li><Link to="/register" className="text-base text-muted-foreground hover:text-foreground">Inscription</Link></li>
                  <li><Link to="/dashboard" className="text-base text-muted-foreground hover:text-foreground">Tableau de bord</Link></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Légal</h3>
                <ul className="mt-4 space-y-4">
                  <li><span onClick={handleContactClick} className="cursor-pointer text-base text-muted-foreground hover:text-foreground">Politique de confidentialité</span></li>
                  <li><span onClick={handleContactClick} className="cursor-pointer text-base text-muted-foreground hover:text-foreground">Conditions d'utilisation</span></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Contact</h3>
                <ul className="mt-4 space-y-4">
                  <li><span onClick={handleContactClick} className="cursor-pointer text-base text-muted-foreground hover:text-foreground">Nous contacter</span></li>
                  <li><span onClick={handleContactClick} className="cursor-pointer text-base text-muted-foreground hover:text-foreground">FAQ</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-base text-muted-foreground xl:text-center">&copy; {new Date().getFullYear()} Dictionnaire Digital Collaboratif du Coaching. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;