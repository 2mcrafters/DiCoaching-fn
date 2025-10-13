import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAllCategories, fetchCategories, createCategory, updateCategory, deleteCategory } from '@/features/categories/categoriesSlice';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

const CategoriesManagement = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectAllCategories);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ libelle: '', description: '' });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ libelle: cat.libelle || cat.name || '', description: cat.description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ libelle: '', description: '' });
  };

  const handleSave = async () => {
    if (!form.libelle.trim()) return;
    if (editingId) {
      await dispatch(updateCategory({ id: editingId, changes: form }));
    } else {
      await dispatch(createCategory(form));
    }
    cancelEdit();
  };

  const handleDelete = async (id) => {
    await dispatch(deleteCategory(id));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Gestion des catégories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input placeholder="Libellé" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {editingId ? (
            <>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2"/>Sauvegarder</Button>
              <Button variant="outline" onClick={cancelEdit}><X className="h-4 w-4 mr-2"/>Annuler</Button>
            </>
          ) : (
            <Button onClick={handleSave}><Plus className="h-4 w-4 mr-2"/>Ajouter</Button>
          )}
        </div>

        <div className="divide-y rounded-md border">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{c.libelle || c.name}</div>
                {c.description && <div className="text-sm text-muted-foreground">{c.description}</div>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => startEdit(c)}><Pencil className="h-4 w-4"/></Button>
                <Button variant="destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4"/></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoriesManagement;
