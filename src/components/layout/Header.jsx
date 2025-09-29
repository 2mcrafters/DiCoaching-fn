import React from 'react';
    import { Link } from 'react-router-dom';
    import { BookOpen, Search, LogIn } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useToast } from "@/components/ui/use-toast";

    const Header = () => {
      const { toast } = useToast();

      const handleSearchClick = () => {
        toast({
          title: "🚧 Fonctionnalité en cours de développement",
          description: "La recherche n'est pas encore implémentée, mais vous pouvez la demander dans votre prochain message ! 🚀",
        });
      };

      return (
        <header className="bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Dico<span className="text-purple-600">Coaching</span>
                </span>
              </Link>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={handleSearchClick}>
                  <Search className="h-5 w-5" />
                </Button>
                <Link to="/login">
                  <Button>
                    <LogIn className="mr-2 h-4 w-4" />
                    Connexion
                  </Button>
                </Link>
                 <Link to="/register">
                  <Button variant="outline">
                    Inscription
                  </Button>
                </Link>
              </div>
            </div>
          </nav>
        </header>
      );
    };

    export default Header;