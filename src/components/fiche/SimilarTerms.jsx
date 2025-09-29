import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Compass } from 'lucide-react';

const SimilarTerms = ({ terms, title = "Termes Similaires" }) => {
  if (!terms || terms.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {terms.map(term => (
            <li key={term.id}>
              <Link 
                to={`/fiche/${term.slug}`} 
                className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-md transition-colors group"
              >
                <div>
                  <h4 className="font-medium text-foreground">{term.term}</h4>
                  <p className="text-sm text-muted-foreground truncate max-w-xs">{term.definition.substring(0, 50)}...</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default SimilarTerms;