import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAllCategories,
  fetchCategories,
} from "@/features/categories/categoriesSlice";

const SubmitFormSection = ({
  formData,
  setFormData,
  hideModeratorComment = false,
}) => {
  const { toast } = useToast();

  const dispatch = useDispatch();
  const categories = useSelector(selectAllCategories);

  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDynamicChange = (field, index, subField, value) => {
    const newArr = [...formData[field]];
    if (typeof newArr[index] === "object" && newArr[index] !== null) {
      newArr[index][subField] = value;
    } else {
      newArr[index] = { [subField]: value };
    }
    setFormData((prev) => ({ ...prev, [field]: newArr }));
  };

  const addDynamicField = (field) => {
    const newItem = field === "sources" ? { text: "" } : { text: "" };
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), newItem],
    }));
  };

  const removeDynamicField = (field, index) => {
    if (formData[field] && formData[field].length > 1) {
      const newArr = formData[field].filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, [field]: newArr }));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
          <CardDescription>
            Les informations essentielles de votre terme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="term">Titre du terme *</Label>
            <Input
              id="term"
              placeholder="Ex: Coaching transformationnel"
              value={formData.term || ""}
              onChange={(e) => handleInputChange("term", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Select
              value={formData.categorie_id ? String(formData.categorie_id) : ""}
              onValueChange={(value) => {
                const id = Number(value);
                const selected = (categories || []).find(
                  (c) => String(c.id) === String(value)
                );
                setFormData((prev) => ({
                  ...prev,
                  categorie_id: id,
                  category:
                    selected?.libelle || selected?.name || prev.category || "",
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {(categories || []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.libelle || c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remarques</CardTitle>
          <CardDescription>
            Ajoutez des précisions, limites ou notes contextuelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Votre remarque (optionnelle)"
              value={(formData.remarques && formData.remarques[0]?.text) || ""}
              onChange={(e) => {
                const value = e.target.value;
                const next =
                  Array.isArray(formData.remarques) &&
                  formData.remarques.length > 0
                    ? [{ ...formData.remarques[0], text: value }]
                    : [{ text: value }];
                setFormData((prev) => ({ ...prev, remarques: next }));
              }}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Définition complète</CardTitle>
          <CardDescription>Développez votre définition</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="definition">Définition détaillée</Label>
            <Textarea
              id="definition"
              placeholder="Définition complète du terme."
              value={formData.definition || ""}
              onChange={(e) => handleInputChange("definition", e.target.value)}
              rows={8}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exemples d'usage</CardTitle>
          <CardDescription>
            Ajoutez des exemples concrets d'utilisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.exemples || []).map((ex, i) => (
            <div key={i} className="flex gap-2">
              <Textarea
                placeholder={`Exemple ${i + 1}`}
                value={ex.text || ""}
                onChange={(e) =>
                  handleDynamicChange("exemples", i, "text", e.target.value)
                }
                rows={2}
              />
              {formData.exemples.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeDynamicField("exemples", i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => addDynamicField("exemples")}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un exemple
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
          <CardDescription>
            Ajoutez des liens vers des sources complémentaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.sources || []).map((src, i) => (
            <div key={i} className="space-y-2 p-4 border rounded-lg">
              <div className="flex gap-2">
                <Input
                  placeholder="Source"
                  value={src.text || ""}
                  onChange={(e) =>
                    handleDynamicChange("sources", i, "text", e.target.value)
                  }
                />
                {formData.sources.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeDynamicField("sources", i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => addDynamicField("sources")}
              className="flex-1"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Ajouter une source
            </Button>
          </div>
        </CardContent>
      </Card>

      {!hideModeratorComment && (
        <Card>
          <CardHeader>
            <CardTitle>Commentaire pour les modérateurs</CardTitle>
            <CardDescription>
              Optionnel : ajoutez des informations pour les modérateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Informations supplémentaires, sources, contexte..."
              value={formData.moderatorComment || ""}
              onChange={(e) =>
                handleInputChange("moderatorComment", e.target.value)
              }
              rows={3}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default SubmitFormSection;
