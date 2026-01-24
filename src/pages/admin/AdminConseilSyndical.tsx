import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { FileText, Plus, Pencil, Trash2, Download, Calendar, Key, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CompteRendu {
  id: string;
  title: string;
  file_url: string;
  date: string;
  created_at: string;
}

const compteRenduSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  date: z.string().min(1, "La date est requise"),
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
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(compteRenduSchema),
    defaultValues: {
      title: "",
      date: "",
    },
  });

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
      .order('date', { ascending: false });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setComptesRendus(data || []);
    }
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({ title: 'Erreur', description: 'Seuls les fichiers PDF sont acceptés', variant: 'destructive' });
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
    if (!editingId && !file) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un fichier PDF', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl = editingId ? comptesRendus.find(cr => cr.id === editingId)?.file_url : '';

      if (file) {
        fileUrl = await uploadFile(file);
      }

      if (editingId) {
        const { error } = await supabase
          .from('comptes_rendus_conseil_syndical')
          .update({
            title: values.title,
            date: values.date,
            file_url: fileUrl,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: 'Succès', description: 'Compte rendu modifié avec succès' });
      } else {
        const { error } = await supabase
          .from('comptes_rendus_conseil_syndical')
          .insert({
            title: values.title,
            date: values.date,
            file_url: fileUrl,
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

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte rendu ?')) return;

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
    form.reset();
    setFile(null);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (cr: CompteRendu) => {
    setEditingId(cr.id);
    form.setValue('title', cr.title);
    form.setValue('date', cr.date);
    setIsDialogOpen(true);
  };

  const handlePasswordChange = async (values: z.infer<typeof passwordSchema>) => {
    setIsSubmitting(true);

    try {
      // Use RPC function instead of Edge Function
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
            Gérez les comptes rendus et le mot de passe d'accès
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un compte rendu
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="dialog-compte-rendu-description">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Modifier le compte rendu' : 'Ajouter un compte rendu'}
                </DialogTitle>
                <DialogDescription id="dialog-compte-rendu-description">
                  {editingId ? 'Modifiez les informations du compte rendu.' : 'Ajoutez un nouveau compte rendu du conseil syndical.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
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
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <Label htmlFor="file">Fichier PDF {editingId && '(optionnel)'}</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Définir le mot de passe
              </Button>
            </DialogTrigger>
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

        {comptesRendus.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucun compte rendu pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comptesRendus.map((cr) => (
              <Card key={cr.id} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1 text-foreground line-clamp-2">
                        {cr.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(cr.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href={cr.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full" variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </a>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(cr)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(cr.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConseilSyndical;
