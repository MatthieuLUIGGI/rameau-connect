import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Plus } from 'lucide-react';
import { z } from 'zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableAGCard } from '@/components/admin/SortableAGCard';
import { EmptyAGSlot } from '@/components/admin/EmptyAGSlot';

interface CompteRendu {
  id: string;
  title: string;
  file_url: string;
  date: string;
  created_at: string;
  order_index: number;
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchComptesRendus();
  }, []);

  const fetchComptesRendus = async () => {
    const { data, error } = await supabase
      .from('comptes_rendus_ag')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setComptesRendus(data || []);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = comptesRendus.findIndex((item) => item.id === active.id);
      const newIndex = comptesRendus.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(comptesRendus, oldIndex, newIndex);
      setComptesRendus(newOrder);

      // Update order_index in database for all items
      const updates = newOrder.map((cr, index) => ({
        id: cr.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('comptes_rendus_ag')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      toast({ title: 'Succès', description: 'Ordre mis à jour' });
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
      if (selectedFile.size > 10 * 1024 * 1024) {
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
        // Supprimer les anciennes notifications pour ce compte rendu avant d'en créer de nouvelles
        await supabase
          .from('notifications')
          .delete()
          .eq('type', 'compte_rendu')
          .eq('reference_id', editingCR.id);

        const { data: usersData } = await supabase
          .from('profiles')
          .select('id');
        
        if (usersData) {
          const notifications = usersData.map(profile => ({
            user_id: profile.id,
            type: 'compte_rendu' as const,
            reference_id: editingCR.id,
            title: `Compte rendu AG modifié : ${formData.title}`
          }));
          
          await supabase.from('notifications').insert(notifications);
        }
        
        toast({ title: 'Succès', description: 'Compte rendu modifié avec succès' });
        fetchComptesRendus();
        resetForm();
      }
    } else {
      // Get the next order_index
      const nextOrderIndex = comptesRendus.length;
      
      const { data: newCompteRendu, error } = await supabase
        .from('comptes_rendus_ag')
        .insert([{ ...formData, file_url: fileUrl, order_index: nextOrderIndex }])
        .select()
        .single();
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else if (newCompteRendu) {
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
    
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    await supabase.storage
      .from('ag-reports')
      .remove([fileName]);

    const { error } = await supabase
      .from('comptes_rendus_ag')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
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

  const openAddDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  // Create array of 6 slots, filling with reports where they exist
  const slots = Array.from({ length: 6 }).map((_, index) => {
    return comptesRendus[index] || null;
  });

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Gestion des Comptes Rendus AG</h1>
        <p className="text-muted-foreground mt-2">
          {comptesRendus.length}/6 emplacements utilisés - Glissez-déposez pour réorganiser
        </p>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={comptesRendus.map(cr => cr.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {slots.map((cr, index) => {
                if (cr) {
                  return (
                    <SortableAGCard
                      key={cr.id}
                      cr={cr}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                    />
                  );
                }
                
                return (
                  <Card 
                    key={`empty-${index}`}
                    className="border-dashed border-2 border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={openAddDialog}
                  >
                    <CardContent className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">Ajouter un compte rendu</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

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
  );
};

export default AdminAG;
