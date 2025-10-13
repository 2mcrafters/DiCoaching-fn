import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useDispatch, useSelector } from "react-redux";
import { selectAllTerms, fetchTerms } from "@/features/terms/termsSlice";
import { selectAllUsers, fetchUsers } from "@/features/users/usersSlice";
import {
  fetchGlobalStats,
  selectGlobalStats,
  selectStatsLoading,
} from "@/features/dashboard/dashboardStatsSlice";
import {
  fetchReports,
  selectReportsLoading,
} from "@/features/reports/reportsSlice";
import AdminStats from "@/components/admin/AdminStats";
import TermsManagement from "@/components/admin/TermsManagement";
import UsersManagement from "@/components/admin/UsersManagement";
import PendingAuthors from "@/components/admin/PendingAuthors";
import CategoriesManagement from "@/components/admin/CategoriesManagement";
import ReportsManagement from "@/components/admin/ReportsManagement";
import ProposedModifications from "@/components/admin/ProposedModifications";
import { FileText, Users, UserCheck, ShieldAlert, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import apiService from "@/services/api";

const Admin = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const terms = useSelector(selectAllTerms);
  const users = useSelector(selectAllUsers);
  const globalStats = useSelector(selectGlobalStats);
  const statsLoading = useSelector(selectStatsLoading);
  const reportsLoading = useSelector(selectReportsLoading);
  const [activeTab, setActiveTab] = useState("pendingAuthors");
  const [modifications, setModifications] = useState([]);

  useEffect(() => {
    // Fetch comprehensive admin stats from database
    dispatch(fetchGlobalStats());

    // Ensure Redux has latest from backend for detailed management
    if (!terms || terms.length === 0) dispatch(fetchTerms({ limit: 10000 }));
    if (!users || users.length === 0) dispatch(fetchUsers());
    dispatch(fetchReports());

    // Fetch modifications
    const fetchAdminData = async () => {
      try {
        const modificationsRes = await apiService.getModifications();
        setModifications(modificationsRes.data || []);
      } catch (error) {
        console.error("Error fetching modifications:", error);
        setModifications([]);
      }
    };

    fetchAdminData();
  }, [dispatch, terms?.length, users?.length]);

  const handleDataUpdate = () => {
    dispatch(fetchTerms({ limit: 10000 }));
    dispatch(fetchUsers());
    dispatch(fetchReports());
    dispatch(fetchGlobalStats());
  };

  // Use database stats when available, fallback to computed stats
  const pendingAuthorsCount = globalStats.pendingUsers ?? 0;
  const pendingModificationsCount = globalStats.pendingModifications ?? 0;
  const pendingReportsCount = globalStats.pendingReports ?? 0;

  const TABS = [
    {
      id: "pendingAuthors",
      label: "Auteurs en attente",
      icon: UserCheck,
      count: pendingAuthorsCount,
    },
    {
      id: "modifications",
      label: "Modifications",
      icon: Edit,
      count: pendingModificationsCount,
    },
    {
      id: "reports",
      label: "Signalements",
      icon: ShieldAlert,
      count: pendingReportsCount,
    },
    { id: "terms", label: "Gestion des termes", icon: FileText, count: 0 },
    { id: "categories", label: "Catégories", icon: FileText, count: 0 },
    { id: "users", label: "Gestion des utilisateurs", icon: Users, count: 0 },
  ];

  return (
    <>
      <Helmet>
        <title>Administration - Dictionnaire Collaboratif</title>
        <meta
          name="description"
          content="Interface d'administration pour gérer les utilisateurs et les termes du dictionnaire."
        />
      </Helmet>

      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">
              Tableau de Bord{" "}
              <span className="creative-gradient-text">Admin</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Gérez les utilisateurs et les contenus du dictionnaire.
            </p>
          </motion.div>

          <AdminStats globalStats={globalStats} loading={statsLoading} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2 bg-muted/50 p-2 rounded-xl">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-background text-primary shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeTab === "pendingAuthors" && (
              <PendingAuthors allUsers={users} onUpdate={handleDataUpdate} />
            )}
            {activeTab === "modifications" && (
              <ProposedModifications
                allModifications={modifications}
                allUsers={users}
                onUpdate={handleDataUpdate}
              />
            )}
            {activeTab === "terms" && (
              <TermsManagement
                allTerms={terms}
                allUsers={users}
                onUpdate={handleDataUpdate}
              />
            )}
            {activeTab === "categories" && <CategoriesManagement />}
            {activeTab === "users" && (
              <UsersManagement
                allUsers={users}
                currentUser={user}
                onUpdate={handleDataUpdate}
              />
            )}
            {activeTab === "reports" && (
              <ReportsManagement
                allUsers={users}
                loadingOverride={reportsLoading}
                onUpdate={handleDataUpdate}
              />
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Admin;
