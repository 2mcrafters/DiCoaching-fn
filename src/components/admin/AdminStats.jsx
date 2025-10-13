import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, UserCheck, ShieldAlert, Edit } from "lucide-react";
import { motion } from "framer-motion";

const AdminStats = ({ globalStats, loading }) => {
  const totalUsers = globalStats?.totalUsers ?? 0;
  const totalTerms = globalStats?.totalTerms ?? 0;
  const totalReports = globalStats?.totalReports ?? 0;
  const totalModifications = globalStats?.totalModifications ?? 0;
  const pendingAuthors = globalStats?.pendingUsers ?? 0;
  const pendingReports = globalStats?.pendingReports ?? 0;
  const pendingModifications = globalStats?.pendingModifications ?? 0;
  const recentUsers = globalStats?.recentUsers ?? 0;
  const recentTerms = globalStats?.recentTerms ?? 0;

  const stats = [
    {
      title: "Utilisateurs Total",
      value: totalUsers,
      icon: Users,
      color: "from-blue-500 to-blue-400",
      subtitle: `+${recentUsers} cette semaine`,
    },
    {
      title: "Termes Total",
      value: totalTerms,
      icon: FileText,
      color: "from-green-500 to-green-400",
      subtitle: `+${recentTerms} cette semaine`,
    },
    {
      title: "Auteurs en attente",
      value: pendingAuthors,
      icon: UserCheck,
      color: "from-yellow-500 to-yellow-400",
      urgent: pendingAuthors > 0,
    },
    {
      title: "Signalements",
      value: totalReports,
      icon: ShieldAlert,
      color: "from-red-500 to-red-400",
      subtitle: `${pendingReports} en attente`,
      urgent: pendingReports > 0,
    },
    {
      title: "Modifications",
      value: totalModifications,
      icon: Edit,
      color: "from-purple-500 to-purple-400",
      subtitle: `${pendingModifications} en attente`,
      urgent: pendingModifications > 0,
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="h-full"
          >
            <Card
              className={`h-full flex flex-col justify-between bg-gradient-to-br ${
                stat.color
              } text-white border-none shadow-lg ${
                stat.urgent ? "ring-2 ring-red-400/60" : ""
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon
                  className={`h-5 w-5 ${
                    stat.urgent ? "animate-pulse" : ""
                  } text-white/80`}
                />
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-white/80 text-xs mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminStats;
