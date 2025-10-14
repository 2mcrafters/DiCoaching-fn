import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText,
  Search,
  Users,
  AlertCircle,
  Inbox,
  Plus,
  RefreshCw,
  Home,
  ArrowLeft,
} from 'lucide-react';

/**
 * Empty State Component
 * Displays friendly messages when no content is available
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = "Aucun élément",
  description = "Il n'y a rien à afficher pour le moment.",
  action,
  actionLabel = "Créer",
  onAction,
  secondaryAction,
  secondaryActionLabel = "Retour",
  onSecondaryAction,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-6 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      
      <div className="flex gap-3">
        {action && onAction && (
          <Button onClick={onAction} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
        
        {secondaryAction && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline" size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * No Results State - For search/filter scenarios
 */
export const NoResults = ({
  searchTerm,
  onClear,
  onReset,
  suggestions = [],
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16"
    >
      <div className="rounded-full bg-muted p-6 w-fit mx-auto mb-6">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h3>
      
      {searchTerm && (
        <p className="text-muted-foreground mb-4">
          Aucun résultat pour "{searchTerm}"
        </p>
      )}
      
      <p className="text-sm text-muted-foreground mb-6">
        Essayez de modifier vos critères de recherche ou effacez les filtres.
      </p>
      
      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Suggestions :</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, i) => (
              <Button key={i} variant="outline" size="sm">
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-3 justify-center">
        {onClear && (
          <Button onClick={onClear} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Effacer la recherche
          </Button>
        )}
        {onReset && (
          <Button onClick={onReset}>
            <Home className="h-4 w-4 mr-2" />
            Réinitialiser les filtres
          </Button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Error State - For error scenarios
 */
export const ErrorState = ({
  title = "Une erreur s'est produite",
  description = "Impossible de charger les données. Veuillez réessayer.",
  error,
  onRetry,
  onGoHome,
  showDetails = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <div className="rounded-full bg-destructive/10 p-6 w-fit mx-auto mb-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        {description}
      </p>
      
      {showDetails && error && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6 max-w-lg mx-auto">
          <p className="text-xs text-left font-mono text-muted-foreground">
            {error.toString()}
          </p>
        </div>
      )}
      
      <div className="flex gap-3 justify-center">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        )}
        {onGoHome && (
          <Button onClick={onGoHome} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Coming Soon State
 */
export const ComingSoon = ({
  title = "Bientôt disponible",
  description = "Cette fonctionnalité est en cours de développement.",
  onNotify,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="text-6xl mb-6">🚀</div>
      
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        {description}
      </p>
      
      {onNotify && (
        <Button onClick={onNotify} variant="outline">
          Me notifier
        </Button>
      )}
    </motion.div>
  );
};

/**
 * Specific Empty States for common scenarios
 */
export const EmptyTerms = ({ onCreateTerm, hasPermission = false }) => (
  <EmptyState
    icon={FileText}
    title="Aucun terme pour le moment"
    description="Soyez le premier à enrichir le dictionnaire en ajoutant un terme."
    action={hasPermission}
    actionLabel="Ajouter un terme"
    onAction={onCreateTerm}
  />
);

export const EmptyAuthors = () => (
  <EmptyState
    icon={Users}
    title="Aucun auteur trouvé"
    description="Il n'y a pas encore d'auteurs à afficher."
  />
);

export const EmptyDocuments = ({ onAddDocument, canAdd = true }) => (
  <EmptyState
    icon={FileText}
    title="Aucun document"
    description="Vous n'avez pas encore ajouté de documents."
    action={canAdd}
    actionLabel="Ajouter un document"
    onAction={onAddDocument}
  />
);

export default {
  EmptyState,
  NoResults,
  ErrorState,
  ComingSoon,
  EmptyTerms,
  EmptyAuthors,
  EmptyDocuments,
};
