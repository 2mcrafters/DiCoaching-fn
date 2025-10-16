import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Search,
  Edit,
  Share2,
  Globe,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2, // ✅ added
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import useTerms from "@/hooks/useTerms";
import { useAuth } from "@/contexts/AuthContext";
import PhotoCarousel from "@/components/home/PhotoCarousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LatestTermsSection = () => {
  // use Redux-backed terms (fallback to DataContext if needed)
  const {
    items: reduxTerms,
    loading: reduxLoading,
    error: reduxError,
  } = useTerms();
  const { terms: ctxTerms, loading: ctxLoading, error: ctxError } = useData();

  const terms = reduxTerms && reduxTerms.length ? reduxTerms : ctxTerms;
  const loading = reduxLoading || ctxLoading;
  const error = reduxError || ctxError;

  const getLatestTerms = () => {
    return [...terms]
      .filter((term) => term.status === "published")
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
            <Button>Proposer un terme</Button>
          </Link>
        </CardContent>
      </Card>
    );
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
  const { user, hasAuthorPermissions } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const searchRef = React.useRef(null);
  const { terms } = useData();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleTermClick = (slug) => {
    navigate(`/fiche/${slug}`);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Update suggestions when search query changes
  // Only search in term names that start with the search query
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = terms
        .filter((term) => term.status === "published")
        .filter((term) => term.term.toLowerCase().startsWith(query))
        .slice(0, 10); // Show top 10 suggestions with scroll

      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, terms]);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ checklist content for the “À propos” section
  const bioPoints = [
    "Coach professionnel certifié et Membre de l’ICF, actuellement coach de dirigeants, formateur en coaching interculturel et consultant en RH, organisation et stratégie.",
    "Diplômé en droit privé et en management, ancien Directeur général d’un grand groupe industriel, avec une longue expérience de responsabilités.",
    "Praticien en PNL et AT, docteur en psychologie clinique et auteur du Dictionnaire du Coach Global.",
    "Centres d’intérêts : anthropologie, culture d’entreprise, socio-psychologie et interculturel.",
    "Fondateur de l’association Trait d’Union Pour le Handicap (Marrakech, 2006).",
    "Fondateur du Centre d’Éveil (Marrakech, 2004) pour la prise en charge pluridisciplinaire des personnes à capacités réduites.",
    "Psychologue impliqué dans la prévention psychologique des projets SOS Villages d’Enfants Maroc.",
    "Psychologue et psychothérapeute pour enfants et adultes (cabinets à Marrakech et Casablanca).",
    "Consultant et formateur de renommée.",
    "Conférencier régulier.",
  ];

  const features = [
    {
      icon: Search,
      title: "Recherche Avancée",
      description:
        "Trouvez rapidement les concepts qui vous intéressent grâce à notre moteur de recherche intelligent.",
    },
    {
      icon: BookOpen,
      title: "Fiches Détaillées",
      description:
        "Chaque terme dispose d'une fiche complète avec définitions, exemples et ressources.",
    },
    {
      icon: Edit,
      title: "Édition Collaborative",
      description:
        "Contribuez et enrichissez le dictionnaire avec vos connaissances et expériences.",
    },
    {
      icon: Users,
      title: "Communauté Active",
      description:
        "Échangez avec d'autres professionnels du coaching dans un environnement bienveillant.",
    },
    {
      icon: Share2,
      title: "Partage Facile",
      description:
        "Partagez vos découvertes et créations avec la communauté en quelques clics.",
    },
    {
      icon: Globe,
      title: "Accès Libre",
      description:
        "Toutes les ressources sont accessibles gratuitement à tous les passionnés de coaching.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dicoaching - Dictionnaire Collaboratif du Coaching</title>
        <meta
          name="description"
          content="Découvrez le dictionnaire collaboratif du coaching. Consultez, créez et enrichissez des fiches sur les concepts du coaching avec notre communauté."
        />
      </Helmet>

      <div className="min-h-screen">
        <section className="relative overflow-hidden creative-hero-bg text-white">
          <div className="absolute inset-0 hero-pattern opacity-20"></div>
          <div className="relative max-w-7xl mx-auto py-24 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span> Dicoaching</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                  Dictionnaire Collaboratif du Coaching
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-purple-100">
                Un outil vivant pour consulter, créer, commenter et enrichir des
                fiches sur les concepts du coaching
              </p>

              {/* Search Bar */}
              <div
                className="max-w-2xl mx-auto mb-8 px-4 sm:px-0"
                ref={searchRef}
              >
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                    <Input
                      type="text"
                      placeholder="Rechercher un terme dans le dictionnaire..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.trim() && suggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      className="pl-12 pr-4 py-6 text-lg rounded-full bg-white/95 backdrop-blur border-2 border-white/20 focus:border-white/40 text-foreground placeholder:text-muted-foreground shadow-lg"
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-96">
                        <div className="max-h-80 overflow-y-auto">
                          {suggestions.map((term) => (
                            <button
                              key={term.id}
                              type="button"
                              onClick={() => handleTermClick(term.slug)}
                              className="w-full text-left px-6 py-4 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-semibold text-primary text-lg mb-1">
                                {term.term}
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {term.definition}
                              </div>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigate(
                              `/search?q=${encodeURIComponent(
                                searchQuery.trim()
                              )}`
                            );
                            setShowSuggestions(false);
                          }}
                          className="w-full text-center px-6 py-3 text-sm font-medium text-primary hover:bg-purple-50 transition-colors border-t border-gray-200"
                        >
                          Voir tous les résultats pour "{searchQuery}"
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/search">
                  <Button
                    size="lg"
                    className="font-semibold px-8 py-3"
                    style={{
                      backgroundColor: "#334fdb",
                      color: "#ffffff",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = "#2640c4";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = "#334fdb";
                    }}
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Découvrir le dictionnaire
                  </Button>
                </Link>
                {((typeof hasAuthorPermissions === "function" &&
                  hasAuthorPermissions()) ||
                  user?.role === "admin") && (
                  <Link to="/submit">
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-semibold px-8 py-3 border-white/80 text-white"
                      style={{
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.12)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <Edit className="mr-2 h-5 w-5" />
                      Contribuer
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-background transition-all duration-500 hover:bg-muted/20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-center">
                Les derniers termes ajoutés
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-left md:text-center">
                Découvrez les concepts les plus récents partagés par notre
                communauté
              </p>
            </motion.div>
            <LatestTermsSection />
            <div className="mt-12 text-center">
              <Link to="/search">
                <Button
                  size="lg"
                  className="px-8"
                  style={{
                    backgroundColor: "#884dee",
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = "#884dee";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = "#884ded";
                  }}
                >
                  Découvrir le dictionnaire
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why We Created This Dictionary - Creative Section */}
        <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-purple-900/5 dark:to-blue-900/5 transition-all duration-700 hover:from-purple-100 hover:via-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:via-purple-900/10 dark:hover:to-blue-900/10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                <span className="text-foreground">Pourquoi </span>
                <span style={{ color: "#884dee" }}>Dicoaching</span>
                <span className="text-foreground"> ?</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Une vision collaborative pour démocratiser le savoir en coaching
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg transition-all duration-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md hover:scale-105">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Un besoin identifié
                      </h3>
                      <p className="text-muted-foreground">
                        Le coaching professionnel manquait d'une ressource
                        centralisée, accessible et collaborative pour définir et
                        partager les concepts clés de la discipline.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg transition-all duration-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md hover:scale-105">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        La force du collectif
                      </h3>
                      <p className="text-muted-foreground">
                        En réunissant l'expertise de coachs professionnels,
                        formateurs et chercheurs, nous créons une base de
                        connaissances vivante et enrichie par la diversité des
                        pratiques.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg transition-all duration-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md hover:scale-105">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Accessible à tous
                      </h3>
                      <p className="text-muted-foreground">
                        Démocratiser l'accès au savoir en coaching en offrant
                        une plateforme gratuite, ouverte et participative où
                        chacun peut apprendre et contribuer.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-8 text-white shadow-2xl transition-all duration-500 hover:shadow-purple-500/50 hover:scale-105 hover:from-purple-600 hover:to-blue-700">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/30 hover:scale-110">
                        <span className="text-3xl font-bold">💡</span>
                      </div>
                      <h3 className="text-2xl font-bold">Notre mission</h3>
                    </div>

                    <p className="text-lg leading-relaxed text-white/90">
                      Créer un espace de référence pour le coaching
                      professionnel, où la terminologie est clarifiée, enrichie
                      et partagée par une communauté engagée de praticiens et
                      d'experts.
                    </p>

                    <div className="pt-4 border-t border-white/20">
                      <p className="text-sm text-white/80 italic">
                        "Le savoir partagé est un savoir multiplié. Ensemble,
                        nous construisons la référence francophone du coaching."
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">1000+</div>
                        <div className="text-sm text-white/80">Termes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">50+</div>
                        <div className="text-sm text-white/80">Auteurs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">∞</div>
                        <div className="text-sm text-white/80">Croissance</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* === À propos - Elegant Magazine Style === */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-all duration-500 relative overflow-hidden">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #884dee 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            ></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10 px-4">
            {/* Section Header with decorative line */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-purple-500"></div>
                <span className="text-sm uppercase tracking-widest text-purple-600 dark:text-purple-400 font-semibold">
                  Le Fondateur
                </span>
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-purple-500"></div>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
                <span className="text-foreground">Mohamed Rachid</span>
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-foreground">Belhadj</span>
                  <span className="absolute bottom-2 left-0 w-full h-4 bg-purple-200 dark:bg-purple-900/50 -z-0"></span>
                </span>
              </h2>
              <p className="text-xl text-muted-foreground italic max-w-2xl mx-auto">
                "Architecte du savoir, bâtisseur de communautés"
              </p>
            </motion.div>

            {/* Main Grid Layout */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column - Large Feature Image */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="lg:col-span-5 space-y-6"
              >
                {/* Main portrait */}
                <div className="relative group overflow-hidden rounded-3xl shadow-2xl">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src="/images/02.jpeg"
                      alt="Mohamed Rachid Belhadj"
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                      loading="lazy"
                    />
                  </div>
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute bottom-8 left-8 right-8">
                      <p className="text-white text-lg font-semibold">
                        Expert en Coaching
                      </p>
                      <p className="text-white/80 text-sm">
                        20+ années d'excellence
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secondary image carousel */}
                <div className="relative rounded-2xl overflow-hidden shadow-xl group">
                  <div className="aspect-[16/9]">
                    <PhotoCarousel />
                  </div>
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      Gallery
                    </p>
                  </div>
                </div>

                {/* Quote section - moved here */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="absolute -left-4 -top-4 text-8xl text-purple-200 dark:text-purple-900/30 font-serif leading-none">
                    "
                  </div>
                  <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8 pl-12 border-l-4 border-purple-500 shadow-lg">
                    <p className="text-lg text-foreground italic leading-relaxed mb-4">
                      Le coaching transforme les vies. En partageant ce savoir,
                      nous multiplions son impact et créons un mouvement de
                      transformation collective.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Mohamed Rachid Belhadj, Fondateur
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column - Content */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="lg:col-span-7 space-y-8"
              >
                {/* Introduction text block */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl p-8 border border-purple-100 dark:border-purple-900/30">
                  <h3 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
                    Un parcours d'excellence
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Pionnier du coaching professionnel, Mohamed Rachid Belhadj a
                    consacré sa carrière à l'élévation des standards du coaching
                    et au développement d'une communauté de praticiens engagés
                    et compétents.
                  </p>
                </div>

                {/* Bio points in 2-column grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {bioPoints.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      viewport={{ once: true }}
                      className="group relative"
                    >
                      <div className="h-full bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        {/* Icon */}
                        <div className="mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        {/* Text */}
                        <p className="text-sm text-foreground leading-relaxed">
                          {point}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-6 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                  <div className="text-center border-r border-white/20 last:border-r-0">
                    <div className="text-4xl font-bold mb-2">20+</div>
                    <div className="text-sm text-white/90 uppercase tracking-wide">
                      Ans d'expérience
                    </div>
                  </div>
                  <div className="text-center border-r border-white/20 last:border-r-0">
                    <div className="text-4xl font-bold mb-2">1000+</div>
                    <div className="text-sm text-white/90 uppercase tracking-wide">
                      Coachs formés
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">50+</div>
                    <div className="text-sm text-white/90 uppercase tracking-wide">
                      Publications
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background transition-all duration-500 hover:bg-muted/20">
          <div className="max-w-7xl mx-auto">
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
                Découvrez tous les outils à votre disposition pour explorer et
                enrichir le dictionnaire
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center md:place-items-stretch">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-transparent hover:border-primary text-left w-full">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 creative-hero-bg text-white transition-all duration-700 hover:scale-[1.01]">
          <div className="max-w-4xl mx-auto text-center">
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
                Commencez dès maintenant à explorer et contribuer au
                dictionnaire collaboratif du coaching
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="font-semibold px-8 py-3"
                    style={{
                      backgroundColor: "#884dee",
                      color: "#ffffff",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = "#7738cb";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = "#884dee";
                    }}
                  >
                    Créer un compte
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/search">
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold px-8 py-3 border-white/80 text-white"
                    style={{
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.12)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
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
