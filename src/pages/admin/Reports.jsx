import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { selectAllUsers, fetchUsers } from "@/features/users/usersSlice";
import {
  fetchReports,
  selectReportsLoading,
} from "@/features/reports/reportsSlice";
import ReportsManagement from "@/components/admin/ReportsManagement";

const Reports = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsers);
  const reportsLoading = useSelector(selectReportsLoading);

  useEffect(() => {
    dispatch(fetchReports());
    if (!users || users.length === 0) {
      dispatch(fetchUsers());
    }
  }, [dispatch, users?.length]);

  const handleRefresh = () => {
    dispatch(fetchReports());
    dispatch(fetchUsers());
  };

  return (
    <>
      <Helmet>
        <title>Gestion des Signalements - Administration</title>
        <meta
          name="description"
          content="Gérez les signalements des utilisateurs sur les termes du dictionnaire."
        />
      </Helmet>
      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Gestion des Signalements
            </h1>
            <p className="text-muted-foreground">
              Examinez et traitez les signalements des utilisateurs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <ReportsManagement
              allUsers={users}
              loadingOverride={reportsLoading}
              onUpdate={handleRefresh}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Reports;
