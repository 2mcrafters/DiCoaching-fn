import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, UserPlus, Sparkles, Heart, MessageCircle, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actionIcons = {
  like: Heart,
  comment: MessageCircle,
  reply: MessageCircle,
  report: Flag,
  default: Lock,
};

const LoginRequiredPopup = ({ 
  isOpen, 
  onOpenChange, 
  action = 'default',
  title = "Connexion requise",
  description = "Vous devez être connecté pour effectuer cette action."
}) => {
  const navigate = useNavigate();
  const Icon = actionIcons[action] || actionIcons.default;

  useEffect(() => {
    if (isOpen) {
      // Add a subtle shake effect to the icon
      const timer = setTimeout(() => {
        // Keep popup open for user interaction
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/login');
  };

  const handleRegister = () => {
    onOpenChange(false);
    navigate('/register');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden border-2 border-primary/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </div>

          <DialogHeader className="relative z-10">
            <div className="flex justify-center mb-4">
              <motion.div
                className="relative"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="relative">
                    {/* Glowing background */}
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    
                    {/* Main icon with gradient background */}
                    <div className="relative z-10 bg-gradient-to-br from-primary to-purple-600 p-4 rounded-full">
                      <Icon className="h-12 w-12 text-white" />
                    </div>

                    {/* Sparkle effects */}
                    <AnimatePresence>
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: [0, (i - 1) * 30],
                            y: [0, -20 - i * 10]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeOut"
                          }}
                          style={{
                            top: '50%',
                            left: '50%',
                          }}
                        >
                          <Sparkles className="h-4 w-4 text-yellow-400" />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {title}
              </DialogTitle>
              <DialogDescription className="text-center mt-2 text-base">
                {description}
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          <motion.div
            className="flex flex-col gap-3 mt-6 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleLogin}
              className="w-full group relative overflow-hidden"
              size="lg"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <LogIn className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Se connecter
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou
                </span>
              </div>
            </div>

            <Button
              onClick={handleRegister}
              variant="outline"
              className="w-full group border-2 hover:border-primary"
              size="lg"
            >
              <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Créer un compte
            </Button>

            <motion.p 
              className="text-xs text-center text-muted-foreground mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Rejoignez notre communauté et profitez de toutes les fonctionnalités ! 🎉
            </motion.p>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginRequiredPopup;
