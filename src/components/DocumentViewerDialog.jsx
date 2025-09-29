import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DocumentViewerDialog = ({ isOpen, onOpenChange, document }) => {
  if (!document) return null;

  const docName = document.name || document.title || 'Document';
  const docUrl = document.url;

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(docName);
  const isPDF = /\.pdf$/i.test(docName);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{docName}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
            {isImage && (
                <img src={docUrl} alt={docName} className="w-full h-full object-contain" />
            )}
            {isPDF && (
                <iframe src={docUrl} title={docName} className="w-full h-full border-0" />
            )}
            {!isImage && !isPDF && (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Le format de ce document n'est pas supporté pour un aperçu.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerDialog;