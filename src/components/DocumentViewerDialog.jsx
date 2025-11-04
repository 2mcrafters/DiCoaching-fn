import React, { useEffect, useMemo, useState } from 'react';
import { buildDocumentUrl } from '@/lib/uploadUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DocumentViewerDialog = ({ isOpen, onOpenChange, document }) => {
  if (!document) return null;

  const docName = document.name || document.title || 'Document';
  // Build robust URLs for preview and download
  const previewUrl = useMemo(() => {
    return buildDocumentUrl(document) || document.url || document.downloadUrl || '';
  }, [document]);
  // No direct download link in this dialog per request
  const mime = document.mime || document.mimetype || '';

  // Detect type by extension or mimetype
  const isImage = useMemo(() => {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(docName)) return true;
    return /^image\//i.test(mime);
  }, [docName, mime]);
  const isPDF = useMemo(() => {
    if (/\.pdf$/i.test(docName)) return true;
    return /application\/pdf/i.test(mime);
  }, [docName, mime]);

  // Workaround for PDF being blocked in iframe by backend CSP/X-Frame-Options:
  // fetch the file and create a blob: URL to embed locally
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let revoked = false;
    let createdUrl = null;
    async function loadBlob() {
  if (!isPDF || !previewUrl) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(previewUrl, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type') || '';
        const blob = await res.blob();
        // Ensure the blob has proper type so viewer renders correctly
        const pdfBlob = contentType.includes('application/pdf')
          ? blob
          : new Blob([blob], { type: 'application/pdf' });
        createdUrl = URL.createObjectURL(pdfBlob);
        if (!revoked) setBlobUrl(createdUrl);
      } catch (e) {
        console.error('Failed to fetch PDF for preview:', e);
        if (!revoked) setError(e.message || 'Erreur de chargement');
      } finally {
        if (!revoked) setLoading(false);
      }
    }
    setBlobUrl(null);
  if (isPDF) loadBlob();
    return () => {
      revoked = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [isPDF, previewUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="truncate">{docName}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          {isImage && (
            <img src={previewUrl} alt={docName} className="w-full h-full object-contain" />
          )}

          {isPDF && (
            <div className="w-full h-full">
              {loading && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Chargement de l'aperçu PDF...
                </div>
              )}
              {!loading && !error && blobUrl && (
                <iframe src={blobUrl} title={docName} className="w-full h-full border-0" />
              )}
              {!loading && error && (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
                  <p className="text-muted-foreground">
                    Impossible d'afficher l'aperçu PDF (raison: {error}).
                  </p>
                  {/* Download and external open intentionally removed */}
                </div>
              )}
            </div>
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