import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Upload, Loader2 } from 'lucide-react';
import { z } from 'zod';

interface CompteRendu {
  id: string;
  title: string;
  file_url: string;
  date: string;
  created_at: string;
}

const compteRenduSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(200, "Le titre ne peut pas dépasser 200 caractères"),
  date: z.string().min(1, "La date est requise"),
});

const AdminAG = () => {
  const [comptesRendus, setComptesRendus] = useState<CompteRendu[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCR, setEditingCR] = useState<CompteRendu | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComptesRendus();
  }, []);

  const fetchComptesRendus = async () => {
    const { data, error } = await supabase
      .from('comptes_rendus_ag')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setComptesRendus(data || []);
    }
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
      .from('ag-reports')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Erreur', description: uploadError.message, variant: 'destructive' });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ag-reports')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    // Validate input
    const validation = compteRenduSchema.safeParse(formData);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Validation échouée', description: errors, variant: 'destructive' });
      setIsUploading(false);
      return;
    }

    if (!editingCR && !file) {
      toast({ 
        title: 'Erreur', 
        description: 'Veuillez sélectionner un fichier PDF', 
        variant: 'destructive' 
      });
      setIsUploading(false);
      return;
    }
    
    let fileUrl = editingCR?.file_url || '';

    // Upload new file if provided
    if (file) {
      const uploadedUrl = await uploadFile(file);
      if (!uploadedUrl) {
        setIsUploading(false);
        return;
      }
      fileUrl = uploadedUrl;
    }

    if (editingCR) {
      const { error } = await supabase
        .from('comptes_rendus_ag')
        .update({ ...formData, file_url: fileUrl })
        .eq('id', editingCR.id);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Succès', description: 'Compte rendu modifié avec succès' });
        fetchComptesRendus();
        resetForm();
      }
    } else {
      const { data: newCompteRendu, error } = await supabase
        .from('comptes_rendus_ag')
        .insert([{ ...formData, file_url: fileUrl }])
        .select()
        .single();
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else if (newCompteRendu) {
        // Créer une notification pour tous les utilisateurs
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id');
        
        if (usersData) {
          const notifications = usersData.map(profile => ({
            user_id: profile.id,
            type: 'compte_rendu' as const,
            reference_id: newCompteRendu.id,
            title: `Nouveau compte rendu AG : ${formData.title}`
          }));
          
          await supabase.from('notifications').insert(notifications);
        }
        
        toast({ title: 'Succès', description: 'Compte rendu ajouté avec succès' });
        fetchComptesRendus();
        resetForm();
      }
    }
    setIsUploading(false);
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte rendu ?')) return;
    
    // Extract file path from URL
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    // Delete file from storage
    await supabase.storage
      .from('ag-reports')
      .remove([fileName]);

    // Delete database record
    const { error } = await supabase
      .from('comptes_rendus_ag')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      // Supprimer les notifications liées
      await supabase
        .from('notifications')
        .delete()
        .eq('type', 'compte_rendu')
        .eq('reference_id', id);
      
      toast({ title: 'Succès', description: 'Compte rendu supprimé avec succès' });
      fetchComptesRendus();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', date: '' });
    setFile(null);
    setEditingCR(null);
    setIsOpen(false);
  };

  const openEditDialog = (cr: CompteRendu) => {
    setEditingCR(cr);
    setFormData({
      title: cr.title,
      date: cr.date
    });
    setFile(null);
    setIsOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Gestion des Comptes Rendus AG</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un compte rendu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCR ? 'Modifier' : 'Ajouter'} un compte rendu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Assemblée Générale Ordinaire 2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date de l'AG *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">
                  Fichier PDF {!editingCR && '*'}
                  {editingCR && ' (laisser vide pour conserver le fichier actuel)'}
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
                <p className="text-xs text-muted-foreground">
                  Format PDF uniquement, taille maximale 10 MB
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm} disabled={isUploading}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCR ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {comptesRendus.map((cr) => (
          <Card key={cr.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{cr.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(cr.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(cr)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(cr.id, cr.file_url)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <a 
                href={cr.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                📄 Voir le PDF
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminAG;
