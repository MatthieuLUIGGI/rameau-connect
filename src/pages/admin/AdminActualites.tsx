import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Upload, Loader2, Leaf, ImageIcon } from 'lucide-react';
import { z } from 'zod';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { optimizeImage, needsOptimization, formatFileSize, calculateReduction } from '@/lib/imageOptimizer';

interface Actualite {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published_at: string;
  file_url?: string | null;
  priority: 'info' | 'normal' | 'important' | 'urgent';
  expires_at: string | null;
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
    file_url: '' as string | null | '',
    priority: 'normal' as 'info' | 'normal' | 'important' | 'urgent',
    expires_at: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
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
      setActualites((data || []) as unknown as Actualite[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    // Validate input
    const { file_url, priority, expires_at, ...rest } = formData;
    const validation = actualiteSchema.safeParse(rest);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Validation échouée', description: errors, variant: 'destructive' });
      setIsUploading(false);
      return;
    }
    
    // Upload du PDF si fourni
    let newFileUrl = editingActualite?.file_url || null;
    const previousFileUrl = editingActualite?.file_url || null;
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
        .update({ 
          ...rest, 
          file_url: newFileUrl, 
          priority,
          expires_at: expires_at ? new Date(expires_at).toISOString() : null
        })
        .eq('id', editingActualite.id);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        // Si un nouveau fichier a été uploadé et qu'un ancien existait, on supprime l'ancien du storage
        if (file && previousFileUrl && previousFileUrl !== newFileUrl) {
          await deleteFileFromUrl(previousFileUrl);
        }
        toast({ title: 'Succès', description: 'Actualité modifiée avec succès' });
        fetchActualites();
        resetForm();
      }
    } else {
      const { data: newActualite, error } = await supabase
        .from('actualites')
        .insert([{ 
          ...rest, 
          file_url: newFileUrl, 
          author_id: user?.id,
          priority,
          expires_at: expires_at ? new Date(expires_at).toISOString() : null
        }])
        .select()
        .single();
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else if (newActualite) {
        // Créer une notification pour tous les utilisateurs
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id');
        
        if (usersData) {
          const notifications = usersData.map(profile => ({
            user_id: profile.id,
            type: 'actualite' as const,
            reference_id: newActualite.id,
            title: `Nouvelle actualité : ${rest.title}`
          }));
          
          await supabase.from('notifications').insert(notifications);
        }
        
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
          // Supprimer les notifications liées
          await supabase
            .from('notifications')
            .delete()
            .eq('type', 'actualite')
            .eq('reference_id', id);
          
          toast({ title: 'Succès', description: 'Actualité supprimée avec succès' });
          fetchActualites();
        }
  };

  const resetForm = () => {
    setFormData({ title: '', excerpt: '', content: '', image_url: '', file_url: '', priority: 'normal', expires_at: '' });
    setFile(null);
    setImageFile(null);
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
      file_url: actualite.file_url || '',
      priority: actualite.priority,
      expires_at: actualite.expires_at ? new Date(actualite.expires_at).toISOString().split('T')[0] : ''
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

  const uploadOptimizedImage = async (file: File): Promise<string | null> => {
    try {
      let fileToUpload: Blob = file;
      let extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      
      // Optimiser l'image si nécessaire
      if (needsOptimization(file)) {
        const result = await optimizeImage(file);
        fileToUpload = result.blob;
        extension = result.extension;
        
        const reduction = calculateReduction(result.originalSize, result.optimizedSize);
        toast({ 
          title: '🌿 Image optimisée', 
          description: `Réduction de ${reduction}% (${formatFileSize(result.originalSize)} → ${formatFileSize(result.optimizedSize)})`,
        });
      }
      
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      
      const { error: uploadError } = await supabase.storage
        .from('actualites-images')
        .upload(fileName, fileToUpload, {
          contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`
        });

      if (uploadError) {
        // Si le bucket n'existe pas, utiliser actualites-files
        const { error: fallbackError } = await supabase.storage
          .from('actualites-files')
          .upload(`images/${fileName}`, fileToUpload, {
            contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`
          });
        
        if (fallbackError) {
          toast({ title: 'Erreur', description: fallbackError.message, variant: 'destructive' });
          return null;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('actualites-files')
          .getPublicUrl(`images/${fileName}`);
        
        return publicUrl;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('actualites-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'optimiser l\'image', variant: 'destructive' });
      return null;
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/avif', 'image/gif', 'image/bmp', 'image/tiff'].includes(selectedFile.type)) {
        toast({ 
          title: 'Erreur', 
          description: 'Formats autorisés: JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF', 
          variant: 'destructive' 
        });
        return;
      }
      
      // Pas de limite de taille - la compression automatique gère les fichiers lourds
      setIsUploadingImage(true);
      const uploadedUrl = await uploadOptimizedImage(selectedFile);
      if (uploadedUrl) {
        // Insérer l'image dans le contenu de l'éditeur
        const imageHtml = `<p><img src="${uploadedUrl}" alt="Image de l'actualité" style="max-width: 100%; height: auto;" /></p>`;
        setFormData(prev => ({ 
          ...prev, 
          content: prev.content + imageHtml 
        }));
        setImageFile(selectedFile);
        toast({ 
          title: 'Image ajoutée', 
          description: 'L\'image a été insérée dans le contenu',
        });
      }
      setIsUploadingImage(false);
    }
  };

  const extractPathFromPublicUrl = (url: string): string | null => {
    // URL typique: https://<project>.supabase.co/storage/v1/object/public/actualites-files/<path>
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/');
      const publicIndex = parts.indexOf('public');
      if (publicIndex === -1) return null;
      // bucket = parts[publicIndex + 1] (doit être 'actualites-files')
      // path = reste après le bucket
      const pathParts = parts.slice(publicIndex + 2);
      return pathParts.join('/');
    } catch {
      return null;
    }
  };

  const deleteFileFromUrl = async (url: string) => {
    const path = extractPathFromPublicUrl(url);
    const filePath = path ? path : url.split('/').pop() || '';
    if (!filePath) return;
    await supabase.storage.from('actualites-files').remove([filePath]);
  };

  const handleRemoveExistingPdf = async () => {
    if (!editingActualite || !editingActualite.file_url) return;
    if (!confirm('Supprimer le PDF associé à cette actualité ?')) return;
    try {
      setIsDeletingFile(true);
      await deleteFileFromUrl(editingActualite.file_url);
      const { error } = await supabase
        .from('actualites')
        .update({ file_url: null } as any)
        .eq('id', editingActualite.id);
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        return;
      }
      // Mettre à jour l'état local (form + actualité en édition)
      setFormData((prev) => ({ ...prev, file_url: '' }));
      setEditingActualite({ ...editingActualite, file_url: null });
      // Rafraîchir la liste pour refléter le changement
      fetchActualites();
      toast({ title: 'PDF supprimé', description: 'Le fichier a été supprimé avec succès.' });
    } finally {
      setIsDeletingFile(false);
    }
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
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image de l'actualité
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Leaf className="h-3 w-3" />
                    Éco-optimisée
                  </span>
                </Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      id="image_file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      onChange={handleImageFileChange}
                      className="cursor-pointer"
                      disabled={isUploadingImage}
                    />
                    {isUploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Optimisation...
                      </div>
                    )}
                  </div>
                  {formData.image_url && (
                    <div className="flex items-center gap-3">
                      <img 
                        src={formData.image_url} 
                        alt="Aperçu" 
                        className="h-16 w-24 object-cover rounded-md border"
                      />
                      <span className="text-xs text-muted-foreground truncate max-w-xs">
                        {formData.image_url}
                      </span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ou</span>
                    <Input
                      id="image_url"
                      type="url"
                      placeholder="URL de l'image (https://...)"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Leaf className="h-3 w-3 text-green-600" />
                    Les images sont automatiquement compressées et converties en AVIF/WebP pour réduire l'empreinte carbone
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Niveau de priorité *</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="info">Info (bleu clair)</option>
                    <option value="normal">Normal</option>
                    <option value="important">Important (rouge, épinglé)</option>
                    <option value="urgent">Urgent (rouge vif, épinglé en premier)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Date d'expiration (optionnel)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    L'actualité sera masquée après cette date
                  </p>
                </div>
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
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <p>
                      Fichier actuel: <a href={formData.file_url} target="_blank" rel="noreferrer" className="underline">voir le PDF</a>
                    </p>
                    {editingActualite && (
                      <Button type="button" variant="outline" size="sm" onClick={handleRemoveExistingPdf} disabled={isDeletingFile}>
                        {isDeletingFile ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                        Supprimer le PDF
                      </Button>
                    )}
                  </div>
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
        {actualites.map((actualite) => {
          const priorityColors = {
            info: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20',
            normal: '',
            important: 'border-red-500 bg-red-50 dark:bg-red-950/20',
            urgent: 'border-red-700 bg-red-100 dark:bg-red-950/40'
          };
          
          return (
            <Card key={actualite.id} className={priorityColors[actualite.priority]}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle>{actualite.title}</CardTitle>
                      {actualite.priority !== 'normal' && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          actualite.priority === 'urgent' ? 'bg-red-600 text-white' :
                          actualite.priority === 'important' ? 'bg-red-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {actualite.priority === 'urgent' ? '🚨 Urgent' :
                           actualite.priority === 'important' ? '⚠️ Important' :
                           'ℹ️ Info'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(actualite.published_at).toLocaleDateString('fr-FR')}
                      {actualite.expires_at && (
                        <span className="ml-2">
                          • Expire le {new Date(actualite.expires_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
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
          );
        })}
      </div>
    </div>
  );
};

export default AdminActualites;
