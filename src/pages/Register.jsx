import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

import Step1PersonalInfo from '@/components/register/Step1PersonalInfo';
import Step2RoleChoice from '@/components/register/Step2RoleChoice';
import Step3AResearcher from '@/components/register/Step3AResearcher';
import Step3BAuthor from '@/components/register/Step3BAuthor';

const steps = [
  { id: 1, name: 'Infos personnelles' },
  { id: 2, name: 'Choix du rôle' },
  { id: 3, name: 'Finalisation' },
];

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    name: "", // Calculé automatiquement à partir de firstName + lastName
    birthDate: null,
    sex: "",
    phone: "",
    profilePicture: null,
    email: "",
    password: "",
    confirmPassword: "",
    professionalStatus: "",
    otherStatus: "",
    role: "",
    presentation: "",
    documents: [],
    biography: "",
    socials: [
      { network: "Facebook", url: "", customNetwork: "" },
      { network: "Instagram", url: "", customNetwork: "" },
      { network: "LinkedIn", url: "", customNetwork: "" },
      { network: "X", url: "", customNetwork: "" },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogItems, setErrorDialogItems] = useState([]);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);

  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handleBack = () => setCurrentStep((prev) => prev - 1);

  // Fonction pour mettre à jour formData avec nom complet automatique
  const updateFormData = (newData) => {
    const updatedData = { ...formData, ...newData };

    // Si firstName ou lastName changent, mettre à jour automatiquement le champ name
    if (newData.firstName !== undefined || newData.lastName !== undefined) {
      const firstName =
        newData.firstName !== undefined
          ? newData.firstName
          : formData.firstName;
      const lastName =
        newData.lastName !== undefined ? newData.lastName : formData.lastName;
      updatedData.name = `${firstName} ${lastName}`.trim();
    }

    setFormData(updatedData);
  };

  const handleSubmit = async () => {
    // delegate to submitData to allow retries with modified payload
    await submitData(formData);
  };

  const submitData = async (data) => {
    setLoading(true);
    setServerErrors({});
    try {
      const result = await register(data);
      if (result.success) {
        // Show popup if user registered as author (backend accepts 'auteur' but client normalizes to 'author')
        if (data.role === "auteur" || data.role === "author") {
          setShowAuthorPopup(true);
        } else {
          toast({
            title: "Inscription réussie !",
            description: "Bienvenue dans le dictionnaire !",
          });
          navigate("/dashboard");
        }
      } else {
        const err = result.error || {
          message: "Erreur d'inscription",
          fields: {},
        };
        toast({
          title: "Erreur d'inscription",
          description: err.message || "Erreur lors de l'inscription",
          variant: "destructive",
        });

        // If backend provided field-level errors, show them inline and in a popup
        if (
          err.fields &&
          typeof err.fields === "object" &&
          Object.keys(err.fields).length > 0
        ) {
          setServerErrors(err.fields);
          const items = Object.keys(err.fields).map((k) => ({
            field: k,
            message: err.fields[k],
          }));
          setErrorDialogItems(items);
          setShowErrorDialog(true);
        } else {
          // No structured fields: show general error in dialog with suggestions
          setErrorDialogItems([
            { field: "Erreur", message: err.message || "Erreur inconnue" },
          ]);
          setShowErrorDialog(true);
        }

        setCurrentStep(1);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
      setErrorDialogItems([
        { field: "Erreur", message: String(error.message || error) },
      ]);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const retryWithoutDocuments = async () => {
    // Close dialog then retry submitting without documents/profile picture
    setShowErrorDialog(false);
    const newData = {
      ...formData,
      documents: [],
      profilePictureFile: null,
      profilePicture: null,
    };
    setFormData(newData);
    await submitData(newData);
  };

  const handlePopupClose = () => {
    setShowAuthorPopup(false);
    navigate("/dashboard");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PersonalInfo
            formData={formData}
            setFormData={updateFormData}
            onNext={handleNext}
            serverErrors={serverErrors}
          />
        );
      case 2:
        return (
          <Step2RoleChoice
            formData={formData}
            setFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            serverErrors={serverErrors}
          />
        );
      case 3:
        if (formData.role === "chercheur") {
          return (
            <Step3AResearcher
              formData={formData}
              setFormData={updateFormData}
              onBack={handleBack}
              onSubmit={handleSubmit}
              loading={loading}
              serverErrors={serverErrors}
            />
          );
        }
        if (formData.role === "auteur") {
          return (
            <Step3BAuthor
              formData={formData}
              setFormData={updateFormData}
              onBack={handleBack}
              onSubmit={handleSubmit}
              loading={loading}
              serverErrors={serverErrors}
            />
          );
        }
        handleBack();
        return null;
      default:
        return (
          <Step1PersonalInfo
            formData={formData}
            setFormData={updateFormData}
            onNext={handleNext}
          />
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Inscription - Dicoaching</title>
        <meta
          name="description"
          content="Créez votre compte pour rejoindre la communauté du dictionnaire collaboratif du coaching et commencer à contribuer."
        />
      </Helmet>

      <Dialog open={showAuthorPopup} onOpenChange={setShowAuthorPopup}>
        <DialogContent>
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <DialogTitle className="text-2xl">
                Candidature envoyée !
              </DialogTitle>
              <DialogDescription className="mt-2">
                Merci d'avoir postulé. Votre candidature est en cours de
                validation. Vous serez notifié par email une fois votre profil
                approuvé.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handlePopupClose}>Aller au Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              <DialogTitle className="text-2xl">
                Erreurs d'inscription
              </DialogTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Veuillez corriger les erreurs suivantes :
              </p>
            </div>
          </DialogHeader>
          <div className="p-4 max-h-80 overflow-y-auto">
            {errorDialogItems.length === 0 ? (
              <p>Aucune erreur détaillée fournie par le serveur.</p>
            ) : (
              <ul className="space-y-2 text-left">
                {errorDialogItems.map((it, idx) => (
                  <li key={idx} className="border rounded p-2">
                    <strong className="block text-sm">{it.field}</strong>
                    <p className="text-sm text-red-600">{it.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter className="sm:justify-center space-x-2">
            {/* If the server error hints at documents/file DB issue, offer retry without files */}
            {errorDialogItems.some((it) =>
              /original_name|file|document|documents/i.test(it.message)
            ) && (
              <Button
                variant="outline"
                onClick={retryWithoutDocuments}
                disabled={loading}
              >
                Réessayer sans documents
              </Button>
            )}
            <Button onClick={() => setShowErrorDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen flex flex-col items-center justify-center creative-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">
                <span style={{ color: "#884dee" }}>Di</span>
                <span className="text-black dark:text-white">coaching</span>
              </span>
            </Link>
          </div>

          <div className="mb-8 px-4">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                        currentStep > step.id
                          ? "bg-primary text-primary-foreground"
                          : currentStep === step.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {currentStep > step.id ? "✓" : step.id}
                    </div>
                    <p
                      className={`mt-2 text-xs text-center ${
                        currentStep >= step.id
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 transition-colors duration-300 ${
                        currentStep > step.id ? "bg-primary" : "bg-secondary"
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <Card className="shadow-xl">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;