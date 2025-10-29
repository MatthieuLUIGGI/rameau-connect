import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Upload, Loader2 } from 'lucide-react';
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
  file_url?: string | null;
}

const actualiteSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(200, "Le titre ne peut pas dépasser 200 caractères"),
  excerpt: z.string().trim().max(500, "L'extrait ne peut pas dépasser 500 caractères").optional(),
  content: z.string().trim().min(1, "Le contenu est requis"),
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
    image_url: '',
    file_url: '' as string | null | ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
    setIsUploading(true);
    
    // Validate input
    const { file_url, ...rest } = formData;
    const validation = actualiteSchema.safeParse(rest);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Validation échouée', description: errors, variant: 'destructive' });
      setIsUploading(false);
      return;
    }
    
    // Upload du PDF si fourni
    let newFileUrl = editingActualite?.file_url || null;
    if (file) {
      const uploadedUrl = await uploadFile(file);
      if (!uploadedUrl) {
        setIsUploading(false);
        return;
      }
      newFileUrl = uploadedUrl;
    }

    if (editingActualite) {
      const { error } = await supabase
        .from('actualites')
        .update({ ...rest, file_url: newFileUrl })
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
        .insert([{ ...rest, file_url: newFileUrl, author_id: user?.id }]);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Succès', description: 'Actualité ajoutée avec succès' });
        fetchActualites();
        resetForm();
      }
    }
    setIsUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) return;
    
    // Récupérer la fiche pour connaitre un éventuel fichier à supprimer
        const { data: toDeleteData, error: toDeleteError } = await supabase
          .from('actualites')
          .select('file_url')
          .eq('id', id)
          .single();
    
        if (toDeleteError) {
          // Afficher l'erreur de récupération mais continuer la tentative de suppression de la ligne
          toast({ title: 'Erreur', description: toDeleteError.message, variant: 'destructive' });
        }
    
        const toDelete = toDeleteData as { file_url?: string | null } | null;
    
        // Supprimer le fichier du storage si présent
        if (toDelete?.file_url) {
          const urlParts = toDelete.file_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage.from('actualites-files').remove([fileName]);
        }
    
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
    setFormData({ title: '', excerpt: '', content: '', image_url: '', file_url: '' });
    setFile(null);
    setEditingActualite(null);
    setIsOpen(false);
  };

  const openEditDialog = (actualite: Actualite) => {
    setEditingActualite(actualite);
    setFormData({
      title: actualite.title,
      excerpt: actualite.excerpt || '',
      content: actualite.content,
      image_url: actualite.image_url || '',
      file_url: actualite.file_url || ''
    });
    setFile(null);
    setIsOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({ 
          title: 'Erreur', 
          description: 'Veuillez sélectionner un fichier PDF', 
          variant: 'destructive' 
        });
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ 
          title: 'Erreur', 
          description: 'Le fichier ne doit pas dépasser 10 MB', 
          variant: 'destructive' 
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('actualites-files')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Erreur', description: uploadError.message, variant: 'destructive' });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('actualites-files')
      .getPublicUrl(filePath);

    return publicUrl;
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
                <Label htmlFor="file">
                  Fichier PDF (optionnel)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {file.name}
                    </div>
                  )}
                </div>
                {formData.file_url && !file && (
                  <p className="text-xs text-muted-foreground">
                    Fichier actuel: <a href={formData.file_url} target="_blank" rel="noreferrer" className="underline">voir le PDF</a>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Format PDF uniquement, taille maximale 10 MB
                </p>
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
                <Button type="button" variant="outline" onClick={resetForm} disabled={isUploading}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                  {actualite.file_url && (
                    <p className="mt-2 text-sm">
                      <a href={actualite.file_url} target="_blank" rel="noreferrer" className="text-primary underline">📄 Voir le PDF</a>
                    </p>
                  )}
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
