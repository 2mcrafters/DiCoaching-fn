import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAuthorBadge } from '@/lib/badges';
import { useData } from "@/contexts/DataContext";
import { Download, Search, ArrowUpDown } from "lucide-react";

const AuthorsRanking = () => {
  const [authors, setAuthors] = useState([]);
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "score",
    direction: "desc",
  });

  const { terms } = useData();

  useEffect(() => {
    const allUsers = JSON.parse(
      localStorage.getItem("coaching_dict_users") || "[]"
    );
    const allTerms = terms || [];
    const authorUsers = allUsers.filter((user) =>
      ["author", "auteur", "admin"].includes((user.role || "").toLowerCase())
    );

    const authorsWithStats = authorUsers.map((author) => {
      const termsAdded = allTerms.filter(
        (term) => term.authorId === author.id
      ).length;
      const score = termsAdded * 10;
      const badge = getAuthorBadge(score);
      return {
        ...author,
        termsAdded,
        termsModified: 0, // Not tracked yet
        score,
        badge,
        lastActivity: author.createdAt, // Placeholder
      };
    });

    setAuthors(authorsWithStats);
  }, [terms]);

  useEffect(() => {
    let result = [...authors];

    if (searchQuery) {
      result = result.filter((author) =>
        author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredAuthors(result);
  }, [searchQuery, authors, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const exportToCSV = () => {
    const headers = [
      "Auteur",
      "Badge",
      "Score",
      "Termes Ajoutés",
      "Termes Modifiés",
      "Dernière Activité",
    ];
    const rows = filteredAuthors.map((author) => [
      author.name,
      author.badge.name,
      author.score,
      author.termsAdded,
      author.termsModified,
      new Date(author.lastActivity).toLocaleDateString("fr-FR"),
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "classement_auteurs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Helmet>
        <title>Classement des Auteurs - Administration</title>
        <meta
          name="description"
          content="Classement et statistiques des auteurs du dictionnaire."
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
              Classement des Auteurs
            </h1>
            <p className="text-muted-foreground">
              Suivez les performances et contributions des auteurs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="mt-8">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <CardTitle>Auteurs Actifs</CardTitle>
                    <CardDescription>
                      Liste de tous les auteurs avec leurs statistiques.
                    </CardDescription>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un auteur..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={exportToCSV} variant="outline">
                      <Download className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 cursor-pointer"
                          onClick={() => requestSort("name")}
                        >
                          <div className="flex items-center">
                            Auteur {getSortIcon("name")}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 cursor-pointer"
                          onClick={() => requestSort("badge")}
                        >
                          <div className="flex items-center">
                            Badge {getSortIcon("badge")}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 cursor-pointer"
                          onClick={() => requestSort("score")}
                        >
                          <div className="flex items-center">
                            Score {getSortIcon("score")}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 cursor-pointer"
                          onClick={() => requestSort("termsAdded")}
                        >
                          <div className="flex items-center">
                            Termes Ajoutés {getSortIcon("termsAdded")}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 cursor-pointer"
                          onClick={() => requestSort("lastActivity")}
                        >
                          <div className="flex items-center">
                            Dernière Activité {getSortIcon("lastActivity")}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuthors.map((author) => (
                        <tr
                          key={author.id}
                          className="bg-background border-b hover:bg-muted/50"
                        >
                          <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                            {author.name}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${author.badge.bgColor} ${author.badge.textColor}`}
                            >
                              {author.badge.icon} {author.badge.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold">
                            {author.score}
                          </td>
                          <td className="px-6 py-4">{author.termsAdded}</td>
                          <td className="px-6 py-4">
                            {new Date(author.lastActivity).toLocaleDateString(
                              "fr-FR"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAuthors.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    Aucun auteur trouvé.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AuthorsRanking;