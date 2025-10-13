import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createLinkedContentRecursive = (text, publishedTerms) => {
  if (!text) return [text];

  for (const { term, slug } of publishedTerms) {
    const safe = escapeRegex(term);
    const regex = new RegExp(`\\b(${safe})\\b`, "gi");
    const match = regex.exec(text);

    if (match) {
      const before = text.slice(0, match.index);
      const matchedTerm = match[0];
      const after = text.slice(match.index + matchedTerm.length);

      const overlappingTerms = publishedTerms.filter(
        (t) => matchedTerm.includes(t.term) && t.term !== matchedTerm
      );

      let linkContent;
      if (overlappingTerms.length > 0) {
        const innerParts = createLinkedContentRecursive(
          matchedTerm,
          overlappingTerms
        );
        linkContent = innerParts;
      } else {
        linkContent = matchedTerm;
      }

      const mainLink = (
        <Link
          key={slug}
          to={`/fiche/${slug}`}
          className="font-semibold text-primary hover:text-primary/80 underline decoration-2 underline-offset-2 transition-colors duration-200"
        >
          {linkContent}
        </Link>
      );

      const allTermsInMatch = [
        { term: matchedTerm, slug },
        ...overlappingTerms.map((t) => ({ term: t.term, slug: t.slug })),
      ].filter(
        (value, index, self) =>
          self.findIndex((t) => t.slug === value.slug) === index
      );

      let finalElement;
      if (allTermsInMatch.length > 1) {
        finalElement = (
          <Popover>
            <PopoverTrigger asChild>
              <span className="cursor-pointer">{mainLink}</span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold p-2">Termes trouvés :</p>
                {allTermsInMatch.map((t) => (
                  <Link key={t.slug} to={`/fiche/${t.slug}`}>
                    <Button variant="ghost" className="w-full justify-start">
                      {t.term}
                    </Button>
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        );
      } else {
        finalElement = mainLink;
      }

      return [
        ...createLinkedContentRecursive(before, publishedTerms),
        finalElement,
        ...createLinkedContentRecursive(after, publishedTerms),
      ];
    }
  }

  return [text];
};

const LinkedContent = ({ text }) => {
    const { terms } = useData();

    const publishedTerms = React.useMemo(() =>
        terms
            .filter(t => t.status === 'published')
            .map(t => ({ term: t.term, slug: t.slug }))
            .sort((a, b) => b.term.length - a.term.length),
        [terms]
    );

    const contentParts = React.useMemo(() => {
        if (!text || publishedTerms.length === 0) {
            return text ? [text] : [];
        }
        return createLinkedContentRecursive(text, publishedTerms);
    }, [text, publishedTerms]);

    if (!text) {
        return null;
    }

    return <>{contentParts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}</>;
};

export default LinkedContent;