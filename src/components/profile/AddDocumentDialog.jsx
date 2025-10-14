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
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile &&
      (selectedFile.type.startsWith("image/") ||
        selectedFile.type === "application/pdf")
    ) {
      setFile(selectedFile);
      setError("");
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
        const form = new FormData();
        form.append("documents", file);
        // include purpose or metadata if desired
        form.append("purpose", "profile");

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
          onAddDocument(uploaded);
          toast({
            title: "Document ajouté",
            description: "Le document a été uploadé et enregistré.",
          });
          setIsOpen(false);
          setTitle("");
          setFile(null);
          setError("");
          return;
        } else {
          setError(
            data && data.message ? data.message : "Erreur lors de l'upload"
          );
          return;
        }
      } catch (err) {
        console.error("Upload error", err);
        setError("Erreur réseau lors de l'upload");
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
            </div>
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
          <Button type="submit" onClick={handleAdd}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDocumentDialog;