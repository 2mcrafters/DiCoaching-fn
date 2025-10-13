import React, { useState, useEffect } from 'react';
import { useDispatch } from "react-redux";
import { fetchTerms } from "@/features/terms/termsSlice";
import { fetchCategories } from "@/features/categories/categoriesSlice";
import { fetchUsers } from "@/features/users/usersSlice";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataProvider } from "@/contexts/DataContext";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTopButton from "@/components/layout/ScrollToTopButton";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Submit from "@/pages/Submit";
import EditTerm from "@/pages/EditTerm";
import Fiche from "@/pages/Fiche";
import Admin from "@/pages/Admin";
import Search from "@/pages/Search";
import NotFound from "@/pages/NotFound";
import RegistrationComplete from "@/pages/RegistrationComplete";
import Authors from "@/pages/Authors";
import AuthorProfile from "@/pages/AuthorProfile";
import MyProfile from "@/pages/MyProfile";
import AuthorsRanking from "@/pages/admin/AuthorsRanking";
import Reports from "@/pages/admin/Reports";
import ProposeModification from "@/pages/ProposeModification";
import Modifications from "@/pages/Modifications";
import ModificationDetails from "@/pages/ModificationDetails";
import NewsletterPopup from "@/components/layout/NewsletterPopup";
import TermsManagement from "@/components/admin/TermsManagement";
import UsersManagement from "@/components/admin/UsersManagement";
import ApiTest from "@/pages/ApiTest";
import Introduction from "@/pages/Introduction";
import ConnectionTest from "@/pages/ConnectionTest";

const AppContent = () => {
  const { user, loading } = useAuth();
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const dispatch = useDispatch();

  // Fetch Redux data at app start
  useEffect(() => {
    dispatch(fetchTerms());
    dispatch(fetchCategories());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && !user) {
      const newsletterShown = sessionStorage.getItem("newsletterShown");
      if (!newsletterShown) {
        setIsNewsletterOpen(true);
        sessionStorage.setItem("newsletterShown", "true");
      }
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col px-4 sm:px-6 lg:px-8 xl:px-12">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/registration-complete"
            element={<RegistrationComplete />}
          />
          <Route path="/search" element={<Search />} />
          <Route path="/fiche/:slug" element={<Fiche />} />
          <Route path="/authors" element={<Authors />} />
          <Route path="/author/:authorId" element={<AuthorProfile />} />
          <Route path="/api-test" element={<ApiTest />} />
          <Route path="/introduction" element={<Introduction />} />
          <Route path="/connection-test" element={<ConnectionTest />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />
          {/* Settings page removed */}
          <Route
            path="/submit"
            element={
              <ProtectedRoute roles={["admin", "auteur"]}>
                <Submit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:slug"
            element={
              <ProtectedRoute>
                <EditTerm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propose-modification/:slug"
            element={
              <ProtectedRoute>
                <ProposeModification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modifications"
            element={
              <ProtectedRoute>
                <Modifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modifications/:id"
            element={
              <ProtectedRoute>
                <ModificationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/terms"
            element={
              <ProtectedRoute requireAdmin>
                <TermsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <UsersManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/authors-ranking"
            element={
              <ProtectedRoute requireAdmin>
                <AuthorsRanking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requireAdmin>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
      <NewsletterPopup
        isOpen={isNewsletterOpen}
        onOpenChange={setIsNewsletterOpen}
      />
      <ScrollToTopButton />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppContent />
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
