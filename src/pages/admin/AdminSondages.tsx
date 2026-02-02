import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { z } from 'zod';

interface Sondage {
  id: string;
  question: string;
  options: string[];
  active: boolean;
}

interface VoteCount {
  [key: string]: number;
}

const sondageSchema = z.object({
  question: z.string().trim().min(1, "La question est requise").max(500, "La question ne peut pas dépasser 500 caractères"),
  options: z.array(z.string().trim().min(1, "Les options ne peuvent pas être vides").max(200, "Une option ne peut pas dépasser 200 caractères")).min(2, "Au moins 2 options sont requises").max(10, "Maximum 10 options"),
  active: z.boolean()
});

const AdminSondages = () => {
  const [sondages, setSondages] = useState<Sondage[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCount>({});
  const [isOpen, setIsOpen] = useState(false);
  const [editingSondage, setEditingSondage] = useState<Sondage | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', ''],
    active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSondages();
  }, []);

  const fetchSondages = async () => {
    const { data, error } = await supabase
      .from('sondages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      const formatted = (data || []).map(s => ({
        ...s,
        options: s.options as string[]
      }));
      setSondages(formatted);
      
      // Fetch vote counts for each poll
      formatted.forEach(async (sondage) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('sondage_id', sondage.id);
        
        if (count !== null) {
          setVoteCounts(prev => ({ ...prev, [sondage.id]: count }));
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = formData.options.filter(o => o.trim() !== '');
    
    // Validate input
    const validation = sondageSchema.safeParse({ ...formData, options: validOptions });
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Validation échouée', description: errors, variant: 'destructive' });
      return;
    }
    
    if (editingSondage) {
      const { error } = await supabase
        .from('sondages')
        .update({ ...formData, options: validOptions })
        .eq('id', editingSondage.id);
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        // Créer une notification pour tous les utilisateurs lors de la modification
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id');
        
        if (usersData) {
          const notifications = usersData.map(profile => ({
            user_id: profile.id,
            type: 'sondage' as const,
            reference_id: editingSondage.id,
            title: `Sondage modifié : ${formData.question}`
          }));
          
          await supabase.from('notifications').insert(notifications);
        }
        
        toast({ title: 'Succès', description: 'Sondage modifié avec succès' });
        fetchSondages();
        resetForm();
      }
    } else {
      const { data: newSondage, error } = await supabase
        .from('sondages')
        .insert([{ ...formData, options: validOptions }])
        .select()
        .single();
      
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else if (newSondage) {
        // Créer une notification pour tous les utilisateurs
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id');
        
        if (usersData) {
          const notifications = usersData.map(profile => ({
            user_id: profile.id,
            type: 'sondage' as const,
            reference_id: newSondage.id,
            title: `Nouveau sondage : ${formData.question}`
          }));
          
          await supabase.from('notifications').insert(notifications);
        }
        
        toast({ title: 'Succès', description: 'Sondage ajouté avec succès' });
        fetchSondages();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sondage ?')) return;
    
    const { error } = await supabase
      .from('sondages')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      // Supprimer les notifications liées
      await supabase
        .from('notifications')
        .delete()
        .eq('type', 'sondage')
        .eq('reference_id', id);
      
      toast({ title: 'Succès', description: 'Sondage supprimé avec succès' });
      fetchSondages();
    }
  };

  const resetForm = () => {
    setFormData({ question: '', options: ['', ''], active: true });
    setEditingSondage(null);
    setIsOpen(false);
  };

  const openEditDialog = (sondage: Sondage) => {
    setEditingSondage(sondage);
    setFormData({
      question: sondage.question,
      options: [...sondage.options],
      active: sondage.active
    });
    setIsOpen(true);
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Gestion des Sondages</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un sondage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSondage ? 'Modifier' : 'Ajouter'} un sondage</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Options de réponse *</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOption} className="w-full">
                  Ajouter une option
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Sondage actif</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingSondage ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sondages.map((sondage) => (
          <Card key={sondage.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{sondage.question}</CardTitle>
                    {sondage.active && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-300 text-xs rounded">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {voteCounts[sondage.id] || 0} votant{(voteCounts[sondage.id] || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(sondage)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(sondage.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {sondage.options.map((option, index) => (
                  <li key={index} className="text-sm">{option}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminSondages;
