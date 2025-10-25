import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { z } from 'zod';

interface Membre {
  id: string;
  name: string;
  position: string;
  level: number;
  photo_url: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

const membreSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  position: z.string().trim().min(1, "La fonction est requise").max(100, "La fonction ne peut pas dépasser 100 caractères"),
  level: z.number().int().min(1).max(2),
  photo_url: z.string().trim().max(2048, "L'URL ne peut pas dépasser 2048 caractères").url("URL invalide").optional().or(z.literal('')),
  phone: z.string().trim().max(50, "Téléphone trop long").optional().or(z.literal('')),
  email: z.string().trim().email("Email invalide").optional().or(z.literal('')),
  address: z.string().trim().max(255, "Adresse trop longue").optional().or(z.literal(''))
});

const AdminAssemblee = () => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMembre, setEditingMembre] = useState<Membre | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    level: 1,
    photo_url: '',
    phone: '',
    email: '',
    address: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMembres();
  }, []);

  const fetchMembres = async () => {
    const { data, error } = await supabase
      .from('membres_assemblee')
      .select('*')
      .order('level')
      .order('name');
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setMembres(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = membreSchema.safeParse(formData);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Validation échouée', description: errors, variant: 'destructive' });
      return;
    }
    
    if (editingMembre) {
      const { error } = await supabase
        .from('membres_assemblee')
        .update(formData)
        .eq('id', editingMembre.id);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Succès', description: 'Membre modifié avec succès' });
        fetchMembres();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('membres_assemblee')
        .insert([formData]);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Succès', description: 'Membre ajouté avec succès' });
        fetchMembres();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;
    
    const { error } = await supabase
      .from('membres_assemblee')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Membre supprimé avec succès' });
      fetchMembres();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', position: '', level: 1, photo_url: '', phone: '', email: '', address: '' });
    setEditingMembre(null);
    setIsOpen(false);
  };

  const openEditDialog = (membre: Membre) => {
    setEditingMembre(membre);
    setFormData({
      name: membre.name,
      position: membre.position,
      level: membre.level,
      photo_url: membre.photo_url || '',
      phone: membre.phone || '',
      email: membre.email || '',
      address: membre.address || ''
    });
    setIsOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Gestion du syndic</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMembre ? 'Modifier' : 'Ajouter'} un membre</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Fonction *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Président, Vice-président, etc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Niveau hiérarchique *</Label>
                <Select value={formData.level.toString()} onValueChange={(v) => setFormData({ ...formData, level: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Niveau 1 (Bureau)</SelectItem>
                    <SelectItem value="2">Niveau 2 (Conseil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo_url">URL de la photo</Label>
                <Input
                  id="photo_url"
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex: 06 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="prenom.nom@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="N°, rue, code postal, ville"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingMembre ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {membres.map((membre) => (
          <Card key={membre.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {membre.photo_url && (
                    <img src={membre.photo_url} alt={membre.name} className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div>
                    <CardTitle>{membre.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{membre.position}</p>
                    <p className="text-xs text-muted-foreground">Niveau {membre.level}</p>
                    {(membre.phone || membre.email || membre.address) && (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {membre.phone && <p>Tél. {membre.phone}</p>}
                        {membre.email && <p>Email: {membre.email}</p>}
                        {membre.address && <p>Adresse: {membre.address}</p>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(membre)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(membre.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminAssemblee;
