import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from "@/contexts/DataContext";
import AdminStats from "@/components/admin/AdminStats";
import TermsManagement from "@/components/admin/TermsManagement";
import UsersManagement from "@/components/admin/UsersManagement";
import PendingAuthors from "@/components/admin/PendingAuthors";
import ReportsManagement from "@/components/admin/ReportsManagement";
import ProposedModifications from "@/components/admin/ProposedModifications";
import { FileText, Users, UserCheck, ShieldAlert, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pendingAuthors");
  const [terms, setTerms] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [modifications, setModifications] = useState([]);

  const loadData = () => {
    const allTerms = data?.terms || [];
    const allUsers = JSON.parse(
      localStorage.getItem("coaching_dict_users") || "[]"
    );
    const allReports = JSON.parse(
      localStorage.getItem("coaching_dict_reports") || "[]"
    );
    const allModifications = JSON.parse(
      localStorage.getItem("coaching_dict_modifications") || "[]"
    );
    setTerms(allTerms);
    setUsers(allUsers);
    setReports(allReports);
    setModifications(allModifications);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDataUpdate = () => {
    loadData();
  };

  const pendingAuthorsCount = users.filter(
    (u) => u.role === "auteur" && u.status === "pending"
  ).length;
  const pendingModificationsCount = modifications.filter(
    (m) => m.status === "pending"
  ).length;
  const pendingReportsCount = reports.filter(
    (r) => r.status === "pending"
  ).length;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <AdminStats
            terms={terms}
            users={users}
            reports={reports}
            modifications={modifications}
          />

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
            {activeTab === "users" && (
              <UsersManagement
                allUsers={users}
                currentUser={user}
                onUpdate={handleDataUpdate}
              />
            )}
            {activeTab === "reports" && (
              <ReportsManagement
                allReports={reports}
                allUsers={users}
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