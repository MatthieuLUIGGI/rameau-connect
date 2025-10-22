import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Artisan {
  id: string;
  name: string;
  domain: string;
  phone: string | null;
  email: string | null;
  description: string | null;
}

const AdminArtisans = () => {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState<Artisan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    phone: '',
    email: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchArtisans();
  }, []);

  const fetchArtisans = async () => {
    const { data, error } = await supabase
      .from('artisans')
      .select('*')
      .order('name');
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setArtisans(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingArtisan) {
      const { error } = await supabase
        .from('artisans')
        .update(formData)
        .eq('id', editingArtisan.id);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Succès', description: 'Artisan modifié avec succès' });
        fetchArtisans();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('artisans')
        .insert([formData]);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Succès', description: 'Artisan ajouté avec succès' });
        fetchArtisans();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet artisan ?')) return;
    
    const { error } = await supabase
      .from('artisans')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Artisan supprimé avec succès' });
      fetchArtisans();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', domain: '', phone: '', email: '', description: '' });
    setEditingArtisan(null);
    setIsOpen(false);
  };

  const openEditDialog = (artisan: Artisan) => {
    setEditingArtisan(artisan);
    setFormData({
      name: artisan.name,
      domain: artisan.domain,
      phone: artisan.phone || '',
      email: artisan.email || '',
      description: artisan.description || ''
    });
    setIsOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Gestion des Artisans</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un artisan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingArtisan ? 'Modifier' : 'Ajouter'} un artisan</DialogTitle>
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
                <Label htmlFor="domain">Domaine *</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="Plomberie, Électricité, etc."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingArtisan ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {artisans.map((artisan) => (
          <Card key={artisan.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{artisan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{artisan.domain}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(artisan)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(artisan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {artisan.phone && <p>📞 {artisan.phone}</p>}
                {artisan.email && <p>✉️ {artisan.email}</p>}
                {artisan.description && <p className="mt-2">{artisan.description}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminArtisans;
