import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FicheComments from '@/components/fiche/FicheComments';
import ReportDialog from '@/components/fiche/ReportDialog';
import SimilarTerms from '@/components/fiche/SimilarTerms';
import SharePopover from '@/components/SharePopover';
import LinkedContent from '@/components/shared/LinkedContent';
import { getAuthorBadge } from '@/lib/badges';
import { User, Calendar, BookOpen, Share2, Flag, Edit, Pencil, Loader2, Heart, ExternalLink, ArrowLeft } from 'lucide-react';

const Fiche = () => {
    const { slug } = useParams();
    const { user } = useAuth();
    const { terms, loading: dataLoading } = useData();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [term, setTerm] = useState(null);
    const [author, setAuthor] = useState(null);
    const [similarTerms, setSimilarTerms] = useState([]);
    const [similarTermsTitle, setSimilarTermsTitle] = useState("Termes Similaires");
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    const loadData = () => {
        if (dataLoading) return;

        const currentTerm = terms.find(t => t.slug === slug);

        if (currentTerm) {
            setTerm(currentTerm);
            
            if (currentTerm.authorId === 'user-api') {
                setAuthor({ id: 'user-api', name: 'Mohamed Rachid Belhadj', profilePicture: null });
            } else {
                const allUsers = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
                const termAuthor = allUsers.find(u => u.id === currentTerm.authorId);
                setAuthor(termAuthor);
            }

            const allComments = JSON.parse(localStorage.getItem('coaching_dict_comments') || '[]');
            setComments(allComments.filter(c => c.termId === currentTerm.id));

            // Similar terms should also have the "Coaching" category
            let relatedTerms = terms.filter(
                t => t.category === 'Coaching' && t.id !== currentTerm.id
            );

            if (relatedTerms.length > 0) {
                setSimilarTermsTitle("Termes Similaires");
                setSimilarTerms(relatedTerms.slice(0, 5));
            } else if (terms.length > 1) {
                setSimilarTermsTitle("Découvrez aussi");
                const defaultTerms = terms.filter(t => t.id !== currentTerm.id).sort(() => 0.5 - Math.random()).slice(0, 5);
                setSimilarTerms(defaultTerms);
            } else {
                setSimilarTerms([]);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [slug, terms, dataLoading]);

    useEffect(() => {
        if (term) {
            const allLikes = JSON.parse(localStorage.getItem('coaching_dict_likes') || '{}');
            const termLikes = allLikes[term.id] || [];
            setLikes(termLikes.length);
            if (user) {
                setIsLiked(termLikes.includes(user.id));
            }
        }
    }, [term, user]);

    const handleLike = () => {
        if (!user) {
            toast({ title: "Connexion requise", description: "Vous devez être connecté pour aimer un terme.", variant: "destructive" });
            return;
        }
        const allLikes = JSON.parse(localStorage.getItem('coaching_dict_likes') || '{}');
        let termLikes = allLikes[term.id] || [];
        
        if (isLiked) {
            termLikes = termLikes.filter(id => id !== user.id);
        } else {
            termLikes.push(user.id);
        }

        allLikes[term.id] = termLikes;
        localStorage.setItem('coaching_dict_likes', JSON.stringify(allLikes));
        setLikes(termLikes.length);
        setIsLiked(!isLiked);
    };

    const handleCommentSubmit = (content) => {
        const newComment = {
            id: `comment-${Date.now()}`,
            termId: term.id,
            authorId: user.id,
            content: content,
            createdAt: new Date().toISOString(),
        };

        const allComments = JSON.parse(localStorage.getItem('coaching_dict_comments') || '[]');
        localStorage.setItem('coaching_dict_comments', JSON.stringify([...allComments, newComment]));
        loadData();
        toast({ title: 'Commentaire publié !', description: 'Merci pour votre contribution.' });
    };

    const handleReportSubmit = (reason, details) => {
        if (!user) {
            toast({ title: "Connexion requise", description: "Vous devez être connecté pour signaler un terme.", variant: "destructive" });
            return;
        }
        const newReport = {
          id: `report-${Date.now()}`,
          termId: term.id,
          termTitle: term.term,
          reporterId: user.id,
          reason,
          details,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
    
        const allReports = JSON.parse(localStorage.getItem('coaching_dict_reports') || '[]');
        localStorage.setItem('coaching_dict_reports', JSON.stringify([...allReports, newReport]));
        
        setIsReportOpen(false);
        toast({
          title: "Signalement envoyé",
          description: "Merci, les modérateurs vont examiner ce terme.",
        });
      };

    const getAuthorName = (authorId) => {
        if (authorId === 'user-api') return 'Mohamed Rachid Belhadj';
        const allUsers = JSON.parse(localStorage.getItem('coaching_dict_users') || '[]');
        const commentAuthor = allUsers.find(u => u.id === authorId);
        return commentAuthor ? commentAuthor.name : 'Utilisateur';
    };

    if (loading || dataLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-32 w-32 animate-spin text-primary" />
            </div>
        );
    }

    if (!term) {
        return (
            <div className="text-center py-20">
                <h1 className="text-4xl font-bold">404 - Terme non trouvé</h1>
                <p className="text-muted-foreground mt-4">Désolé, le terme que vous cherchez n'existe pas.</p>
                <Link to="/"><Button className="mt-8">Retour à l'accueil</Button></Link>
            </div>
        );
    }

    const canEditDirectly = user && (user.role === 'admin' || user.role === 'auteur');
    const canProposeModification = user && !canEditDirectly;
    const authorBadge = author && author.id !== 'user-api' ? getAuthorBadge(author.termsCount || 0) : null;

    return (
        <>
            <Helmet>
                <title>{term?.term ? `${term.term} - Dictionnaire du Coaching` : 'Dictionnaire du Coaching'}</title>
                <meta name="description" content={term?.definition?.substring(0, 160) || "Fiche de terme du Dictionnaire du Coaching"} />
            </Helmet>

            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/5">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
                >
                    <div className="mb-8">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour
                        </Button>
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                            <div className="flex-1">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-sm py-1 px-3">{term.category}</Badge>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">{term.term}</h1>
                            </div>
                            <div className="flex items-center gap-2 mt-4 md:mt-0">
                                <Button onClick={handleLike} variant={isLiked ? 'default' : 'outline'} size="icon" className="rounded-full transition-all duration-300 w-12 h-12 shadow-md">
                                    <Heart className={`h-6 w-6 ${isLiked ? 'fill-current text-white' : 'text-primary'}`} />
                                </Button>
                                <SharePopover url={window.location.href} title={term.term}>
                                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12 shadow-md">
                                        <Share2 className="h-6 w-6 text-primary" />
                                    </Button>
                                </SharePopover>
                                {user && (
                                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12 shadow-md text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setIsReportOpen(true)}>
                                        <Flag className="h-6 w-6" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
                            {author && (
                                <Link to={author.id !== 'user-api' ? `/author/${author.id}` : '#'} className={`flex items-center gap-2 ${author.id !== 'user-api' ? 'hover:text-foreground' : 'cursor-default'}`}>
                                    <Avatar className="h-8 w-8"><AvatarImage src={author.profilePicture} /><AvatarFallback>{author.name.charAt(0)}</AvatarFallback></Avatar>
                                    <span className="font-medium">{getAuthorName(term.authorId)}</span>
                                </Link>
                            )}
                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Créé le {new Date(term.createdAt).toLocaleDateString('fr-FR')}</span></div>
                            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /><span>{term.views || 0} vues</span></div>
                            <div className="flex items-center gap-2 text-primary">
                                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                                <span className="font-semibold">{likes}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row lg:gap-12">
                    <div className="flex-grow lg:w-2/3 space-y-8">
                        <Card className="shadow-lg border-t-4 border-primary bg-card">
                            <CardHeader><CardTitle className="text-2xl font-bold text-primary">Définition</CardTitle></CardHeader>
                            <CardContent>
                                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90">
                                    <LinkedContent text={term.definition} />
                                </div>
                            </CardContent>
                        </Card>

                        {term.exemples && term.exemples.length > 0 && (
                            <Card className="shadow-lg border-t-4 border-blue-500 bg-card">
                                <CardHeader><CardTitle className="text-2xl font-bold text-blue-500">Exemples</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    {term.exemples.map((ex, i) => (
                                        <div key={i} className="border-l-4 border-blue-400 pl-4 py-2 bg-muted/50 rounded-r-md">
                                            <p className="italic text-muted-foreground">"<LinkedContent text={ex.text} />"</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {term.sources && term.sources.length > 0 && (
                            <Card className="shadow-lg border-t-4 border-green-500 bg-card">
                                <CardHeader><CardTitle className="text-2xl font-bold text-green-500">Sources</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    {term.sources.map((src, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                                            <BookOpen className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                            <div className="text-sm font-medium text-foreground">
                                                <LinkedContent text={src.text} />
                                                {src.url && (
                                                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 ml-2">
                                                      <ExternalLink className="h-3 w-3" /> Lien
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                         <FicheComments comments={comments} onCommentSubmit={handleCommentSubmit} getAuthorName={getAuthorName} />
                    </div>

                    <aside className="lg:w-1/3 space-y-6 mt-8 lg:mt-0 sticky top-24 h-fit">
                         {user && (
                            <Card className="p-4 shadow-lg border-border/50 bg-card">
                                <CardTitle className="text-lg mb-4">Actions</CardTitle>
                                <div className="space-y-2">
                                    {canEditDirectly ? (
                                        <Link to={`/edit/${term.slug}`} className="w-full">
                                            <Button className="w-full"><Edit className="h-4 w-4 mr-2" /> Modifier ce terme</Button>
                                        </Link>
                                    ) : canProposeModification ? (
                                        <Link to={`/propose-modification/${term.slug}`} className="w-full">
                                            <Button variant="secondary" className="w-full"><Pencil className="h-4 w-4 mr-2" /> Proposer une modification</Button>
                                        </Link>
                                    ) : null}
                                </div>
                            </Card>
                        )}
                        
                        {author && author.id !== 'user-api' && authorBadge && (
                             <Card className="shadow-lg border-border/50 bg-card">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Link to={`/author/${author.id}`}>
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={author.profilePicture} alt={author.name} />
                                                <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div>
                                            <Link to={`/author/${author.id}`}><CardTitle>{author.name}</CardTitle></Link>
                                            <p className="text-sm text-muted-foreground">{author.professionalStatus}</p>
                                            <Badge variant={authorBadge.variant} className="mt-2">
                                                {React.cloneElement(authorBadge.icon, { className: "h-3 w-3 mr-1" })}
                                                {authorBadge.name}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        )}
                        
                        <SimilarTerms terms={similarTerms} title={similarTermsTitle} />
                    </aside>
                </div>
                <ReportDialog isOpen={isReportOpen} onOpenChange={setIsReportOpen} onSubmit={handleReportSubmit} />
            </div>
        </>
    );
};

export default Fiche;