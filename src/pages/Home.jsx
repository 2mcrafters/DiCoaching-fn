import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  BookOpen, 
  Users, 
  Search, 
  Edit, 
  Share2, 
  Globe,
  ArrowRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import PhotoCarousel from '@/components/home/PhotoCarousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const LatestTermsSection = () => {
  const { terms, loading, error } = useData();

  const getLatestTerms = () => {
    return [...terms]
      .filter(term => term.status === 'published')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  };
  
  const latestTerms = getLatestTerms();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="pt-6 text-center text-destructive-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p className="font-semibold">Erreur de chargement des termes</p>
          <p className="text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (latestTerms.length === 0) {
    return (
       <Card>
        <CardContent className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun terme publié</h3>
          <p className="text-muted-foreground mb-4">
            Soyez le premier à enrichir le dictionnaire !
          </p>
          <Link to="/submit">
            <Button>
              Proposer un terme
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {latestTerms.map((term, index) => (
        <motion.div
          key={term.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
        >
          <Card className="h-full flex flex-col hover:shadow-xl transition-shadow duration-300 border-transparent hover:border-primary">
            <CardHeader>
              <CardTitle className="text-xl hover:text-primary transition-colors">
                <Link to={`/fiche/${term.slug}`}>{term.term}</Link>
              </CardTitle>
              <CardDescription>{term.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground line-clamp-3">
                {term.definition}
              </p>
            </CardContent>
            <CardFooter>
              <Link to={`/fiche/${term.slug}`} className="w-full">
                <Button variant="outline" className="w-full">
                  Lire la suite <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};


const Home = () => {
  const { user } = useAuth();
  const features = [
    {
      icon: Search,
      title: "Recherche Avancée",
      description: "Trouvez rapidement les concepts qui vous intéressent grâce à notre moteur de recherche intelligent."
    },
    {
      icon: BookOpen,
      title: "Fiches Détaillées",
      description: "Chaque terme dispose d'une fiche complète avec définitions, exemples et ressources."
    },
    {
      icon: Edit,
      title: "Édition Collaborative",
      description: "Contribuez et enrichissez le dictionnaire avec vos connaissances et expériences."
    },
    {
      icon: Users,
      title: "Communauté Active",
      description: "Échangez avec d'autres professionnels du coaching dans un environnement bienveillant."
    },
    {
      icon: Share2,
      title: "Partage Facile",
      description: "Partagez vos découvertes et créations avec la communauté en quelques clics."
    },
    {
      icon: Globe,
      title: "Accès Libre",
      description: "Toutes les ressources sont accessibles gratuitement à tous les passionnés de coaching."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dictionnaire Digital Collaboratif du Coaching - Accueil</title>
        <meta name="description" content="Découvrez le dictionnaire collaboratif du coaching. Consultez, créez et enrichissez des fiches sur les concepts du coaching avec notre communauté." />
      </Helmet>

      <div className="min-h-screen">
        <section className="relative overflow-hidden creative-hero-bg text-white">
          <div className="absolute inset-0 hero-pattern opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Dictionnaire Digital
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                  Collaboratif du Coaching
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-purple-100">
                Un outil vivant pour consulter, créer, commenter et enrichir des fiches sur les concepts du coaching
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/search">
                  <Button size="lg" className="bg-white text-primary hover:bg-purple-50 font-semibold px-8 py-3">
                    <Search className="mr-2 h-5 w-5" />
                    Découvrir le dictionnaire
                  </Button>
                </Link>
                {(user?.role === 'auteur' || user?.role === 'admin') && (
                  <Link to="/submit">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-3">
                      <Edit className="mr-2 h-5 w-5" />
                      Contribuer
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Les derniers termes ajoutés
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Découvrez les concepts les plus récents partagés par notre communauté
              </p>
            </motion.div>
            <LatestTermsSection />
          </div>
        </section>

        <section className="py-20 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="https://i.pravatar.cc/150?u=api-user" alt="Mohamed Rachid Belhadj" />
                  <AvatarFallback>MRB</AvatarFallback>
                </Avatar>
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
                  À propos de <span className="creative-gradient-text">Mohamed Rachid Belhadj</span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Expert en coaching et développement personnel, Mohamed Rachid Belhadj est le fondateur de ce dictionnaire. Sa vision est de créer une ressource complète et accessible pour tous les passionnés et professionnels du coaching, favorisant le partage des connaissances et l'excellence dans la pratique.
                </p>
                <p className="mt-4 text-lg text-muted-foreground">
                  Avec des années d'expérience sur le terrain, il a identifié le besoin d'un outil centralisé pour standardiser et clarifier la terminologie du coaching. Ce projet est l'aboutissement de cette ambition.
                </p>
              </motion.div>
              <div className="mt-10 lg:mt-0">
                <PhotoCarousel />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Fonctionnalités
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Découvrez tous les outils à votre disposition pour explorer et enrichir le dictionnaire
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-transparent hover:border-primary">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 creative-hero-bg text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Prêt à rejoindre la communauté ?
              </h2>
              <p className="text-xl mb-8 text-purple-100">
                Commencez dès maintenant à explorer et contribuer au dictionnaire collaboratif du coaching
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-purple-50 font-semibold px-8 py-3">
                    Créer un compte
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/search">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-3">
                    Explorer maintenant
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;