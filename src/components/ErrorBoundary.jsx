import React from "react";
import { motion } from "framer-motion";
import { Home, RefreshCw, AlertTriangle, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorCount={this.state.errorCount}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }
    return this.props.children;
  }
}

// Creative Error Fallback Component
const ErrorFallback = ({ error, errorInfo, errorCount, onReset, onGoHome }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-screen creative-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full relative z-10"
      >
        <div className="bg-background/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-border/60 overflow-hidden">
          {/* Animated Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white relative overflow-hidden">
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundImage:
                  "linear-gradient(45deg, transparent 25%, rgba(255,255,255,.2) 25%, rgba(255,255,255,.2) 50%, transparent 50%, transparent 75%, rgba(255,255,255,.2) 75%, rgba(255,255,255,.2))",
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              >
                <Bug className="h-16 w-16" />
              </motion.div>

              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Oups ! Une erreur s'est produite
                </h1>
                <p className="text-white/90">
                  Quelque chose s'est mal passé, mais ne vous inquiétez pas !
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Friendly Message */}
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    Que s'est-il passé ?
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    L'application a rencontré une erreur inattendue. Nos
                    développeurs ont été notifiés et travaillent déjà sur une
                    solution.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm font-mono text-muted-foreground">
                {error?.message || "Une erreur inconnue s'est produite"}
              </p>
            </div>

            {/* Technical Details Toggle */}
            {(error || errorInfo) && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  {showDetails ? "Masquer" : "Afficher"} les détails techniques
                  <motion.span
                    animate={{ rotate: showDetails ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    ▼
                  </motion.span>
                </button>

                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 bg-gray-900 text-gray-100 rounded-xl p-4 overflow-auto max-h-64"
                  >
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {error?.stack || "Aucun détail disponible"}
                      {errorInfo &&
                        `\n\nComponent Stack:\n${errorInfo.componentStack}`}
                    </pre>
                  </motion.div>
                )}
              </div>
            )}

            {/* Error Count Warning */}
            {errorCount > 2 && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ⚠️ Cette erreur s'est produite {errorCount} fois. Il peut être
                  préférable de rafraîchir complètement la page ou de contacter
                  le support.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                onClick={onReset}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>

              <Button
                onClick={onGoHome}
                variant="outline"
                className="flex items-center gap-2"
                size="lg"
              >
                <Home className="h-4 w-4" />
                Retour à l'accueil
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex items-center gap-2"
                size="lg"
              >
                <RefreshCw className="h-4 w-4" />
                Recharger la page
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Si le problème persiste, veuillez{" "}
                <a
                  href="mailto:support@dictionnaire.com"
                  className="text-primary hover:underline font-medium"
                >
                  contacter le support
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 -left-10 w-20 h-20 bg-orange-400/20 rounded-full blur-xl -z-10"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-20 -right-10 w-32 h-32 bg-red-400/20 rounded-full blur-xl -z-10"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </motion.div>
    </div>
  );
};

export default ErrorBoundary;
