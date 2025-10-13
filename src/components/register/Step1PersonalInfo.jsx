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

const Step1PersonalInfo = ({ formData, setFormData, onNext }) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
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
    if (!formData.firstName) newErrors.firstName = "Le prénom est requis.";
    if (!formData.lastName) newErrors.lastName = "Le nom est requis.";
    if (!formData.sex) newErrors.sex = "Le sexe est requis.";
    if (!formData.phone) newErrors.phone = "Le numéro de téléphone est requis.";
    if (!formData.email) newErrors.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "L'email est invalide.";
    if (!formData.password) newErrors.password = "Le mot de passe est requis.";
    else if (formData.password.length < 6)
      newErrors.password = "Le mot de passe doit faire au moins 6 caractères.";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    if (!formData.professionalStatus)
      newErrors.professionalStatus = "Le statut est requis.";
    if (formData.professionalStatus === "Autre" && !formData.otherStatus)
      newErrors.otherStatus = "Veuillez préciser votre statut.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    } else {
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
      // Stocker le fichier réel pour l'upload
      setFormData({ ...formData, profilePictureFile: file });

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePicture: reader.result }));
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
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={
                formData.profilePicture ||
                (formData.sex
                  ? getGenderAvatar("temp", formData.sex)
                  : undefined)
              }
              alt="Photo de profil"
            />
            <AvatarFallback>
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Changer la photo
          </Button>
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
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleNext}>Suivant →</Button>
      </div>
    </div>
  );
};

export default Step1PersonalInfo;