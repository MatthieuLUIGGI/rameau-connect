import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { SortableConseilCard } from '@/components/admin/SortableConseilCard';

interface CompteRendu {
  id: string;
  title: string;
  file_url: string | null;
  link_url: string | null;
  date: string;
  created_at: string;
  order_index: number;
}

const compteRenduSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200, "Le titre ne peut pas dépasser 200 caractères"),
  date: z.string().min(1, "La date est requise"),
  type: z.enum(["file", "link"]),
  link_url: z.string().optional(),
});

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const AdminConseilSyndical = () => {
  const [comptesRendus, setComptesRendus] = useState<CompteRendu[]>([]);
  const [slotCount, setSlotCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingCR, setEditingCR] = useState<CompteRendu | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm({
    resolver: zodResolver(compteRenduSchema),
    defaultValues: {
      title: "",
      date: "",
      type: "file" as "file" | "link",
      link_url: "",
    },
  });

  const selectedType = form.watch("type");

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    fetchComptesRendus();
  }, []);

  const fetchComptesRendus = async () => {
    const { data, error } = await supabase
      .from('comptes_rendus_conseil_syndical')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setComptesRendus(data || []);
      // Update slot count if we have more reports than current slots
      if (data && data.length > slotCount) {
        setSlotCount(data.length);
      }
    }
    setIsLoading(false);
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
          .from('comptes_rendus_conseil_syndical')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      toast({ title: 'Succès', description: 'Ordre mis à jour' });
    }
  };

  // Types de fichiers acceptés
  const acceptedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/rtf',
  ];

  const acceptedExtensions = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!acceptedFileTypes.includes(selectedFile.type)) {
        toast({ 
          title: 'Erreur', 
          description: 'Types de fichiers acceptés : PDF, Word, Excel, PowerPoint, Texte', 
          variant: 'destructive' 
        });
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({ title: 'Erreur', description: 'Le fichier ne doit pas dépasser 10 Mo', variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('conseil-syndical-reports')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('conseil-syndical-reports')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (values: z.infer<typeof compteRenduSchema>) => {
    // Validate based on type
    if (values.type === "file" && !editingCR && !file) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un fichier', variant: 'destructive' });
      return;
    }

    if (values.type === "link" && !values.link_url?.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez entrer une URL', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl: string | null = editingCR?.file_url || null;
      let linkUrl: string | null = editingCR?.link_url || null;

      if (values.type === "file") {
        if (file) {
          fileUrl = await uploadFile(file);
        }
        linkUrl = null;
      } else {
        fileUrl = null;
        linkUrl = values.link_url || null;
      }

      if (editingCR) {
        const { error } = await supabase
          .from('comptes_rendus_conseil_syndical')
          .update({
            title: values.title,
            date: values.date,
            file_url: fileUrl,
            link_url: linkUrl,
          })
          .eq('id', editingCR.id);

        if (error) throw error;
        
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
            title: `Compte rendu CS modifié : ${values.title}`
          }));
          
          await supabase.from('notifications').insert(notifications);
        }
        
        toast({ title: 'Succès', description: 'Compte rendu modifié avec succès' });
      } else {
        const nextOrderIndex = comptesRendus.length;
        
        const { error } = await supabase
          .from('comptes_rendus_conseil_syndical')
          .insert({
            title: values.title,
            date: values.date,
            file_url: fileUrl,
            link_url: linkUrl,
            order_index: nextOrderIndex,
          });

        if (error) throw error;
        toast({ title: 'Succès', description: 'Compte rendu ajouté avec succès' });
      }

      resetForm();
      fetchComptesRendus();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string | null) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte rendu ?')) return;

    // Delete file from storage if exists
    if (fileUrl) {
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      await supabase.storage
        .from('conseil-syndical-reports')
        .remove([fileName]);
    }

    const { error } = await supabase
      .from('comptes_rendus_conseil_syndical')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Compte rendu supprimé' });
      fetchComptesRendus();
    }
  };

  const resetForm = () => {
    form.reset({
      title: "",
      date: "",
      type: "file",
      link_url: "",
    });
    setFile(null);
    setEditingCR(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (cr: CompteRendu) => {
    setEditingCR(cr);
    form.setValue('title', cr.title);
    form.setValue('date', cr.date);
    form.setValue('type', cr.link_url ? 'link' : 'file');
    form.setValue('link_url', cr.link_url || '');
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handlePasswordChange = async (values: z.infer<typeof passwordSchema>) => {
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('set_conseil_password', {
        new_password: values.newPassword
      });

      if (error) throw error;

      if (data === true) {
        toast({ title: 'Succès', description: 'Mot de passe défini avec succès' });
        passwordForm.reset();
        setIsPasswordDialogOpen(false);
      } else {
        throw new Error('Erreur lors de la définition du mot de passe');
      }
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create array of slots based on slotCount
  const slots = Array.from({ length: slotCount }).map((_, index) => {
    return comptesRendus[index] || null;
  });

  const handleAddSlot = () => {
    setSlotCount(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            Gestion du Conseil Syndical
          </h1>
          <p className="text-muted-foreground">
            {comptesRendus.length}/{slotCount} emplacement{slotCount > 1 ? 's' : ''} utilisé{slotCount > 1 ? 's' : ''} - Glissez-déposez pour réorganiser
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={handleAddSlot}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un emplacement
          </Button>
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
              <Key className="h-4 w-4 mr-2" />
              Définir le mot de passe
            </Button>
            <DialogContent aria-describedby="dialog-password-description">
              <DialogHeader>
                <DialogTitle>Définir le mot de passe d'accès</DialogTitle>
                <DialogDescription id="dialog-password-description">
                  Ce mot de passe sera requis pour accéder aux documents du conseil syndical.
                </DialogDescription>
              </DialogHeader>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showNewPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmer le mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Enregistrement...' : 'Définir'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                      <SortableConseilCard
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

          <DialogContent className="max-w-2xl" aria-describedby="dialog-compte-rendu-description">
            <DialogHeader>
              <DialogTitle>
                {editingCR ? 'Modifier le compte rendu' : 'Ajouter un compte rendu'}
              </DialogTitle>
              <DialogDescription id="dialog-compte-rendu-description">
                {editingCR ? 'Modifiez les informations du compte rendu.' : 'Ajoutez un nouveau compte rendu du conseil syndical.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Titre du compte rendu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contenu</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="file" id="type-file" />
                            <Label htmlFor="type-file">Fichier</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="link" id="type-link" />
                            <Label htmlFor="type-link">Lien</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedType === "file" && (
                  <div>
                    <Label htmlFor="file">Fichier {editingCR && '(optionnel)'}</Label>
                    <Input
                      id="file"
                      type="file"
                      accept={acceptedExtensions}
                      onChange={handleFileChange}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formats acceptés : PDF, Word, Excel, PowerPoint, Texte (max 10 Mo)
                    </p>
                    {file && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Fichier sélectionné : {file.name}
                      </p>
                    )}
                  </div>
                )}

                {selectedType === "link" && (
                  <FormField
                    control={form.control}
                    name="link_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL du lien *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingCR ? 'Modifier' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminConseilSyndical;
