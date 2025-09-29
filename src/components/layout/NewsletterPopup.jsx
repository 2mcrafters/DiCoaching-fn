import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Mail, PartyPopper } from 'lucide-react';

const NewsletterPopup = ({ isOpen, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast({
        title: 'Adresse e-mail invalide',
        description: 'Veuillez entrer une adresse e-mail valide.',
        variant: 'destructive',
      });
      return;
    }

    const subscribers = JSON.parse(localStorage.getItem('coaching_dict_newsletter_subscribers') || '[]');
    if (subscribers.includes(email)) {
        toast({
            title: 'Déjà inscrit !',
            description: 'Cette adresse e-mail est déjà sur notre liste.',
        });
    } else {
        subscribers.push(email);
        localStorage.setItem('coaching_dict_newsletter_subscribers', JSON.stringify(subscribers));
    }
    
    setSubmitted(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
        setEmail('');
        setSubmitted(false);
    }, 300);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {!submitted ? (
            <>
              <div className="p-6 bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center">
                <Mail className="h-16 w-16" />
              </div>
              <DialogHeader className="p-6 text-center">
                <DialogTitle className="text-2xl font-bold">Rejoignez notre Newsletter !</DialogTitle>
                <DialogDescription>
                  Restez informé des derniers termes, articles et actualités de la communauté du coaching.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="px-6">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="p-6 sm:justify-center">
                  <Button type="submit" className="w-full sm:w-auto">S'inscrire</Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <div className="p-8 text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                    <PartyPopper className="h-20 w-20 text-green-500 mx-auto mb-4" />
                    <DialogTitle className="text-2xl font-bold mb-2">Inscription réussie !</DialogTitle>
                    <DialogDescription>
                        Merci ! Vous recevrez bientôt de nos nouvelles.
                    </DialogDescription>
                    <Button onClick={handleClose} className="mt-6 w-full sm:w-auto">Fermer</Button>
                </motion.div>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsletterPopup;