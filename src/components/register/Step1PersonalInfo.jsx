import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { getGenderAvatar } from "@/lib/avatarUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Eye,
  EyeOff,
  User,
  Upload,
} from "lucide-react";

const Step1PersonalInfo = ({
  formData,
  setFormData,
  onNext,
  serverErrors = {},
}) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);

  const professionalStatuses = [
    "Étudiant",
    "Enseignant / Professeur",
    "Coach / Formateur",
    "Chercheur",
    "Professionnel RH",
    "Autre",
  ];

  const validate = () => {
    const newErrors = {};
    
    // Trim values to avoid whitespace issues
    const firstName = (formData.firstName || "").trim();
    const lastName = (formData.lastName || "").trim();
    const email = (formData.email || "").trim();
    const phone = (formData.phone || "").trim();
    const password = formData.password || "";
    const confirmPassword = formData.confirmPassword || "";
    
    if (!firstName) newErrors.firstName = "Le prénom est requis.";
    if (!lastName) newErrors.lastName = "Le nom est requis.";
    if (!formData.sex) newErrors.sex = "Le sexe est requis.";
    
    if (!phone) {
      newErrors.phone = "Le numéro de téléphone est requis.";
    } else {
      // Allow digits, spaces, +, - and parentheses; require 8-15 digits
      const digits = (phone.match(/\d/g) || []).length;
      if (digits < 8 || digits > 15) {
        newErrors.phone = "Le numéro de téléphone est invalide (8-15 chiffres attendus).";
      }
    }
    
    if (!email) {
      newErrors.email = "L'email est requis.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "L'email est invalide.";
    }
    
    if (!password) {
      newErrors.password = "Le mot de passe est requis.";
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit faire au moins 6 caractères.";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer le mot de passe.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    
    if (!formData.professionalStatus) {
      newErrors.professionalStatus = "Le statut est requis.";
    } else if (formData.professionalStatus === "Autre" && !(formData.otherStatus || "").trim()) {
      newErrors.otherStatus = "Veuillez préciser votre statut.";
    }

    setErrors(newErrors);
    
    // Log errors for debugging
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const isValid = validate();
    
    if (isValid) {
      console.log("Form is valid, proceeding to next step");
      onNext();
    } else {
      console.log("Form has errors, staying on current step");
      toast({
        title: "Champs manquants ou invalides",
        description: "Veuillez corriger les erreurs avant de continuer.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Fichier invalide",
          description: "Veuillez sélectionner une image.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille du fichier ne doit pas dépasser 5MB.",
          variant: "destructive",
        });
        return;
      }

      setImageLoading(true);
      
      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        console.log("Image loaded successfully:", file.name, "Size:", result.length);
        // IMPORTANT: setFormData here is a prop (not React's setState). It expects a plain object
        // of updates to merge, not an updater function. Passing a function would be ignored.
        setFormData({
          profilePictureFile: file,
          profilePicture: result,
        });
        setImageLoading(false);
        
        toast({
          title: "Photo ajoutée",
          description: `${file.name} a été chargé avec succès.`,
        });
      };
      reader.onerror = () => {
        setImageLoading(false);
        toast({
          title: "Erreur",
          description: "Impossible de lire le fichier.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">
        Étape 1: Informations personnelles
      </h2>
      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="relative h-24 w-24">
            {formData.profilePicture ? (
              <div className="relative h-24 w-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                <img
                  src={formData.profilePicture}
                  alt="Photo de profil"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.error("Image failed to load");
                    // Reset to show fallback avatar on error
                    setFormData({
                      profilePicture: null,
                      profilePictureFile: null,
                    });
                  }}
                  onLoad={() => {
                    console.log("Image loaded and displayed");
                  }}
                />
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative h-24 w-24">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={
                      formData.sex
                        ? getGenderAvatar("temp", formData.sex)
                        : undefined
                    }
                    alt="Photo de profil"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100">
                    <User className="h-12 w-12 text-purple-600" />
                  </AvatarFallback>
                </Avatar>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current.click()}
            disabled={imageLoading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {imageLoading
              ? "Chargement..."
              : formData.profilePicture
              ? "Changer la photo"
              : "Ajouter une photo"}
          </Button>
          {formData.profilePictureFile && (
            <p className="text-xs text-muted-foreground">
              {formData.profilePictureFile.name} ({(formData.profilePictureFile.size / 1024).toFixed(0)} Ko)
            </p>
          )}
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
            {serverErrors.firstName && (
              <p className="text-red-500 text-xs mt-1">
                {serverErrors.firstName}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
            {serverErrors.lastName && (
              <p className="text-red-500 text-xs mt-1">
                {serverErrors.lastName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sex">Sexe</Label>
            <Select
              onValueChange={(value) =>
                setFormData({ ...formData, sex: value })
              }
              value={formData.sex}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre sexe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homme">Homme</SelectItem>
                <SelectItem value="femme">Femme</SelectItem>
              </SelectContent>
            </Select>
            {errors.sex && (
              <p className="text-red-500 text-xs mt-1">{errors.sex}</p>
            )}
            {serverErrors.sex && (
              <p className="text-red-500 text-xs mt-1">{serverErrors.sex}</p>
            )}
          </div>

          <div>
            <Label htmlFor="birthDate">Date de naissance</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.birthDate ? (
                    format(formData.birthDate, "PPP", { locale: fr })
                  ) : (
                    <span>Choisissez une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.birthDate}
                  onSelect={(date) =>
                    setFormData({ ...formData, birthDate: date })
                  }
                  initialFocus
                  locale={fr}
                  captionLayout="dropdown-buttons"
                  fromYear={1950}
                  toYear={new Date().getFullYear() - 10}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="06 12 34 56 78"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
          {serverErrors.phone && (
            <p className="text-red-500 text-xs mt-1">{serverErrors.phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="john.doe@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
          {serverErrors.email && (
            <p className="text-red-500 text-xs mt-1">{serverErrors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            {serverErrors.password && (
              <p className="text-red-500 text-xs mt-1">
                {serverErrors.password}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">
              Confirmation du mot de passe
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
            {serverErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {serverErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="professionalStatus">Statut professionnel</Label>
          <Select
            onValueChange={(value) =>
              setFormData({ ...formData, professionalStatus: value })
            }
            value={formData.professionalStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre statut" />
            </SelectTrigger>
            <SelectContent>
              {professionalStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.professionalStatus && (
            <p className="text-red-500 text-xs mt-1">
              {errors.professionalStatus}
            </p>
          )}
          {serverErrors.professionalStatus && (
            <p className="text-red-500 text-xs mt-1">
              {serverErrors.professionalStatus}
            </p>
          )}
        </div>

        {formData.professionalStatus === "Autre" && (
          <div>
            <Label htmlFor="otherStatus">Précisez votre statut</Label>
            <Input
              id="otherStatus"
              value={formData.otherStatus}
              onChange={(e) =>
                setFormData({ ...formData, otherStatus: e.target.value })
              }
            />
            {errors.otherStatus && (
              <p className="text-red-500 text-xs mt-1">{errors.otherStatus}</p>
            )}
            {serverErrors.otherStatus && (
              <p className="text-red-500 text-xs mt-1">
                {serverErrors.otherStatus}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleNext}>Suivant →</Button>
      </div>
    </div>
  );
};

export default Step1PersonalInfo;