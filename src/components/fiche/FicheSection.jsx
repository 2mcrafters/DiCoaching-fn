import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const FicheSection = ({ title, content, type }) => {
  if (!content || (Array.isArray(content) && content.length === 0)) {
    return null;
  }

  const renderContent = () => {
    switch (type) {
      case 'markdown':
        return <div className="markdown-content"><ReactMarkdown>{content}</ReactMarkdown></div>;
      case 'examples':
        return (
          <div className="space-y-4">
            {content.map((example, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Exemple {index + 1}</p>
                <p>{example}</p>
              </div>
            ))}
          </div>
        );
      case 'resources':
        return (
          <div className="space-y-3">
            {content.map((resource, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{resource.title}</h4>
                  <p className="text-sm text-muted-foreground">{resource.url}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
              </div>
            ))}
          </div>
        );
      case 'contributors':
        return (
          <div className="flex items-center gap-4">
            {content.map((contributor, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {contributor.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{contributor.name}</span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-8"
    >
      <Card>
        <CardHeader><CardTitle className="text-xl">{title}</CardTitle></CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </motion.div>
  );
};

export default FicheSection;