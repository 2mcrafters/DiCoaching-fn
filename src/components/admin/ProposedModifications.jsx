import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Edit,
  User,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  FileEdit,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import apiService from "@/services/api";

const ProposedModifications = ({ onUpdate }) => {
  const { toast } = useToast();
  const [modifications, setModifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModifications, setExpandedModifications] = useState(new Set());

  // Charger les modifications depuis l'API
  const fetchModifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getModifications();
      setModifications(response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des modifications:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les modifications proposées.",
        variant: "destructive",
      });
      setModifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModifications();
  }, []);

  const toggleExpanded = (modificationId) => {
    setExpandedModifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(modificationId)) {
        newSet.delete(modificationId);
      } else {
        newSet.add(modificationId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
        );
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approuvée</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejetée</Badge>;
      case "implemented":
        return <Badge className="bg-blue-100 text-blue-800">Implémentée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserName = (modification) => {
    if (modification.firstname && modification.lastname) {
      return `${modification.firstname} ${modification.lastname}`;
    }
    return modification.proposer_email || "Utilisateur inconnu";
  };

  const handleModificationAction = async (modificationId, action) => {
    try {
      let message = "";
      let status = "";

      if (action === "approve") {
        status = "approved";
        message = "Modification approuvée.";
      } else if (action === "reject") {
        status = "rejected";
        message = "Modification rejetée.";
      }

      await apiService.updateModification(modificationId, { status });

      // Mettre à jour localement
      setModifications((prevModifications) =>
        prevModifications.map((m) =>
          m.id === modificationId ? { ...m, status } : m
        )
      );

      if (typeof onUpdate === "function") {
        onUpdate();
      }

      toast({
        title: "Action effectuée",
        description: message,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la modification:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la modification.",
        variant: "destructive",
      });
    }
  };

  const renderChanges = (changes) => {
    if (!changes) return null;

    const changesObj =
      typeof changes === "string" ? JSON.parse(changes) : changes;

    return (
      <div className="space-y-2 mt-2">
        {Object.entries(changesObj).map(([key, value]) => (
          <div
            key={key}
            className="text-sm border-l-4 border-blue-500 pl-4 py-2 bg-blue-50"
          >
            <span className="font-medium capitalize">{key}:</span>
            <div className="mt-1 text-gray-700">
              {Array.isArray(value) ? value.join(", ") : String(value)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const pendingModifications = modifications.filter(
    (m) => m.status === "pending"
  );

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Modifications Proposées</CardTitle>
        <CardDescription>
          Examinez et validez les modifications de termes proposées.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Chargement des modifications...
              </p>
            </div>
          ) : pendingModifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileEdit className="h-12 w-12 mx-auto mb-4 text-purple-500" />
              <p className="font-medium">Aucune modification en attente.</p>
              <p className="text-sm">
                Toutes les suggestions ont été traitées !
              </p>
            </div>
          ) : (
            pendingModifications.map((modification) => (
              <Card
                key={modification.id}
                className="p-4 bg-background/50 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          Modification pour: {modification.term_title}
                        </h3>
                        {getStatusBadge(modification.status)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <User className="inline h-4 w-4 mr-1.5" />
                          Proposée par:{" "}
                          <span className="font-medium ml-1">
                            {getUserName(modification)}
                          </span>
                        </span>
                        <span className="flex items-center">
                          <Calendar className="inline h-4 w-4 mr-1.5" />
                          Le{" "}
                          {new Date(modification.created_at).toLocaleString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                      {modification.comment && (
                        <p className="text-sm border-l-4 pl-4 py-2 bg-muted/50 mt-2 italic">
                          "{modification.comment}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0 flex-wrap">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/modifications/${modification.id}`}>
                          <FileEdit className="mr-2 h-4 w-4" /> Voir les
                          changements
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to={
                            modification.term_slug
                              ? `/fiche/${modification.term_slug}`
                              : `/fiche/${modification.term_id}`
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" /> Voir le terme
                        </Link>
                      </Button>
                      {modification.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleModificationAction(
                                modification.id,
                                "approve"
                              )
                            }
                            className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Approuver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleModificationAction(
                                modification.id,
                                "reject"
                              )
                            }
                            className="text-red-600 hover:text-red-700 border-red-500 hover:bg-red-50"
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => toggleExpanded(modification.id)}
                    >
                      <span>Voir les modifications proposées</span>
                      {expandedModifications.has(modification.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    {expandedModifications.has(modification.id) && (
                      <div className="mt-2">
                        {renderChanges(modification.changes)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposedModifications;
