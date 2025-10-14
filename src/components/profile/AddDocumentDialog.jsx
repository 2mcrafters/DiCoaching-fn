import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import authService from "@/services/authService";
import { Plus } from "lucide-react";

const AddDocumentDialog = ({ onAddDocument, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [purpose, setPurpose] = useState("other");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile &&
      (selectedFile.type.startsWith("image/") ||
        selectedFile.type === "application/pdf")
    ) {
      // enforce 10MB max (server limit is 10MB in uploadService)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFile(null);
        setError(
          "Le fichier dépasse 10MB. Veuillez choisir un fichier plus petit."
        );
      } else {
        setFile(selectedFile);
        setError("");
      }
    } else {
      setFile(null);
      setError("Veuillez sélectionner une image ou un fichier PDF.");
    }
  };

  const handleAdd = async () => {
    if (!title.trim() || !file) {
      setError("Le titre et le fichier sont requis.");
      return;
    }

    // If a userId is provided, upload to backend; otherwise fall back to client-only behavior
    if (userId) {
      try {
        setSubmitting(true);
        const form = new FormData();
        form.append("documents", file);
        // include purpose or metadata if desired
        form.append("purpose", purpose || "profile");

        const resp = await authService.authenticatedRequest(
          `/documents/upload/${userId}`,
          {
            method: "POST",
            body: form,
          }
        );

        const data = await resp.json();
        if (resp.ok && data && data.status === "success") {
          // data.data is an array of uploaded documents
          const uploaded = Array.isArray(data.data)
            ? data.data
            : data.data
            ? [data.data]
            : [];
          const enriched = uploaded.map((d) => ({
            ...d,
            title: title || d.original_filename || d.filename || "Document",
          }));
          onAddDocument(enriched);
          toast({
            title: "Document ajouté",
            description: "Le document a été uploadé et enregistré.",
          });
          setIsOpen(false);
          setTitle("");
          setFile(null);
          setPurpose("other");
          setError("");
          setSubmitting(false);
          return;
        } else {
          setError(
            data && data.message ? data.message : "Erreur lors de l'upload"
          );
          setSubmitting(false);
          return;
        }
      } catch (err) {
        console.error("Upload error", err);
        setError("Erreur réseau lors de l'upload");
        setSubmitting(false);
        return;
      }
    }

    // fallback: client-only add (existing behavior)
    const reader = new FileReader();
    reader.onloadend = () => {
      onAddDocument({
        title: title,
        url: reader.result,
      });
      toast({
        title: "Document ajouté",
        description: "Le document a été ajouté à votre profil.",
      });
      setIsOpen(false);
      setTitle("");
      setFile(null);
      setPurpose("other");
      setError("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" /> Ajouter un document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
          <DialogDescription>
            Ajoutez un titre et sélectionnez un fichier (image ou PDF).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="doc-title" className="text-right">
              Titre
            </Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="doc-file" className="text-right">
              Fichier
            </Label>
            <div className="col-span-3">
              <Input
                id="doc-file"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
              {file && (
                <p className="mt-2 text-xs text-muted-foreground truncate">
                  {file.name} • {(file.size / 1024).toFixed(0)} Ko
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="doc-purpose" className="text-right">
              Type
            </Label>
            <select
              id="doc-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="col-span-3 h-9 rounded-md border px-3 text-sm bg-background"
            >
              <option value="cv">CV</option>
              <option value="diploma">Diplôme</option>
              <option value="certificate">Certificat</option>
              <option value="identity">Identité</option>
              <option value="other">Autre</option>
            </select>
          </div>
          {error && (
            <p className="col-span-4 text-center text-red-500 text-sm">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
          >
            Annuler
          </Button>
          <Button type="submit" onClick={handleAdd} disabled={submitting}>
            {submitting ? "Ajout..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDocumentDialog;