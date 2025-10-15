import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bug, ShieldAlert, WifiOff, ServerCrash, FileQuestion, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Error Testing Page
 * Provides quick access to all error pages for testing and demonstration
 */
const ErrorTest = () => {
  const navigate = useNavigate();

  const errorPages = [
    {
      title: "404 - Not Found",
      description: "Page doesn't exist",
      icon: FileQuestion,
      path: "/this-page-does-not-exist",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "403 - Unauthorized",
      description: "Access denied / insufficient permissions",
      icon: ShieldAlert,
      path: "/unauthorized",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Network Error",
      description: "Connection problems / offline",
      icon: WifiOff,
      path: "/network-error",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "500 - Server Error",
      description: "Internal server error",
      icon: ServerCrash,
      path: "/server-error",
      color: "text-red-600",
      bgColor: "bg-red-600/10",
    },
    {
      title: "React Error Boundary",
      description: "Component rendering error",
      icon: Bug,
      path: "/trigger-react-error",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      action: () => {
        // Trigger a React error
        throw new Error("Intentional React error for testing");
      },
    },
  ];

  const handleNavigate = (page) => {
    if (page.action) {
      page.action();
    } else {
      navigate(page.path);
    }
  };

  return (
    <>
      <Helmet>
        <title>Error Pages Test | DictCoaching</title>
        <meta name="description" content="Test all error pages and error handling scenarios" />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Error Pages Testing</h1>
          <p className="text-lg text-muted-foreground">
            Click on any card below to test the corresponding error page
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {errorPages.map((page, index) => {
            const Icon = page.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleNavigate(page)}
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full ${page.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-8 w-8 ${page.color}`} />
                  </div>
                  <CardTitle className="text-xl">{page.title}</CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Test This Error
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">📝 What to Test:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Verify each error page displays correctly</li>
                <li>Test all action buttons (Go Back, Go Home, Retry, etc.)</li>
                <li>Check animations are smooth</li>
                <li>Verify responsive design on mobile</li>
                <li>Test network error with offline mode</li>
                <li>Check that error pages have proper metadata (SEO)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🎯 Expected Behavior:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>404:</strong> Shows search box and popular pages</li>
                <li><strong>403:</strong> Context-aware message (authenticated vs not)</li>
                <li><strong>Network:</strong> Real-time online/offline status</li>
                <li><strong>500:</strong> Shows troubleshooting steps</li>
                <li><strong>React Error:</strong> Shows error details with retry option</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🔧 Manual Testing:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Test 404:</strong> Navigate to any non-existent URL</li>
                <li><strong>Test 403:</strong> Try accessing /admin without admin role</li>
                <li><strong>Test Network:</strong> Turn off WiFi/Ethernet and reload</li>
                <li><strong>Test 500:</strong> Temporarily break a backend endpoint</li>
                <li><strong>Test React Error:</strong> Click the React Error card above</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={() => navigate("/")} className="w-full">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ErrorTest;
