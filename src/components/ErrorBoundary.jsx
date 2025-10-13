import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log error to an external service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: "#b00", background: "#fffbe6" }}>
          <h2>Une erreur s'est produite dans l'application.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error)}</pre>
          <p>Essayez de recharger la page ou contactez le support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
