import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { z } from 'zod';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Actualite {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published_at: string;
}

const actualiteSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(200, "Le titre ne peut pas dépasser 200 caractères"),
  excerpt: z.string().trim().max(500, "L'extrait ne peut pas dépasser 500 caractères").optional(),
  content: z.string().trim().min(1, "Le contenu est requis").max(500000, "Le contenu ne peut pas dépasser 500000 caractères"),
  image_url: z.string().trim().max(2048, "L'URL ne peut pas dépasser 2048 caractères").url("URL invalide").optional().or(z.literal(''))
});

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ]
};

const AdminActualites = () => {
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingActualite, setEditingActualite] = useState<Actualite | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image_url: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchActualites();
  }, []);

  const fetchActualites = async () => {
    const { data, error } = await supabase
      .from('actualites')
      .select('*')
      .order('published_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setActualites(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = actualiteSchema.safeParse(formData);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Validation échouée', description: errors, variant: 'destructive' });
      return;
    }
    
    if (editingActualite) {
      const { error } = await supabase
        .from('actualites')
        .update(formData)
        .eq('id', editingActualite.id);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Succès', description: 'Actualité modifiée avec succès' });
        fetchActualites();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('actualites')
        .insert([{ ...formData, author_id: user?.id }]);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Succès', description: 'Actualité ajoutée avec succès' });
        fetchActualites();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) return;
    
    const { error } = await supabase
      .from('actualites')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Actualité supprimée avec succès' });
      fetchActualites();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', excerpt: '', content: '', image_url: '' });
    setEditingActualite(null);
    setIsOpen(false);
  };

  const openEditDialog = (actualite: Actualite) => {
    setEditingActualite(actualite);
    setFormData({
      title: actualite.title,
      excerpt: actualite.excerpt || '',
      content: actualite.content,
      image_url: actualite.image_url || ''
    });
    setIsOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Gestion des Actualités</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une actualité
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingActualite ? 'Modifier' : 'Ajouter'} une actualité</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Extrait</Label>
                <Input
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL de l'image</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Contenu *</Label>
                <div className="bg-background border rounded-md">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    modules={quillModules}
                    className="min-h-[300px]"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingActualite ? 'Modifier' : 'Publier'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {actualites.map((actualite) => (
          <Card key={actualite.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle>{actualite.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(actualite.published_at).toLocaleDateString('fr-FR')}
                  </p>
                  {actualite.excerpt && <p className="mt-2 text-sm">{actualite.excerpt}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(actualite)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(actualite.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {actualite.image_url && (
              <CardContent>
                <img src={actualite.image_url} alt={actualite.title} className="w-full h-48 object-cover rounded-lg" />
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminActualites;
