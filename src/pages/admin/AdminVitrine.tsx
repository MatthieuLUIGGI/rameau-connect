import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImagePlus, Save, Trash2, Loader2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/auditLog";
import { optimizeImage, needsOptimization, formatFileSize, calculateReduction } from "@/lib/imageOptimizer";

const AdminVitrine = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("");
  const [vitrineId, setVitrineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchVitrine();
  }, []);

  const fetchVitrine = async () => {
    const { data } = await supabase.from("vitrine").select("*").limit(1).single();
    if (data) {
      setVitrineId(data.id);
      setImageUrl(data.image_url);
      setDescription(data.description || "");
      setCredits(data.credits || "");
    }
    setLoading(false);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erreur", description: "Seules les images sont acceptées", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      let fileToUpload: Blob = file;
      let ext = file.name.split(".").pop() || "jpg";

      if (needsOptimization(file)) {
        const result = await optimizeImage(file);
        fileToUpload = result.blob;
        ext = result.extension;
        const reduction = calculateReduction(result.originalSize, result.optimizedSize);
        toast({
          title: "Image optimisée",
          description: `${formatFileSize(result.originalSize)} → ${formatFileSize(result.optimizedSize)} (-${reduction}%)`,
        });
      }

      const fileName = `vitrine-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("vitrine").upload(fileName, fileToUpload, { upsert: true, contentType: `image/${ext === "jpg" ? "jpeg" : ext}` });
      if (error) {
        toast({ title: "Erreur", description: "Impossible d'uploader l'image", variant: "destructive" });
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("vitrine").getPublicUrl(fileName);
      setImageUrl(urlData.publicUrl);
      toast({ title: "Image uploadée avec succès" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de traiter l'image", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleSave = async () => {
    if (!vitrineId) return;
    setSaving(true);

    const { error } = await supabase.from("vitrine").update({
      image_url: imageUrl,
      description,
      credits,
      updated_at: new Date().toISOString(),
    }).eq("id", vitrineId);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    } else {
      toast({ title: "Vitrine mise à jour avec succès" });
      logAudit({ action: "update", entityType: "vitrine", entityId: vitrineId, page: "/admin/vitrine" });
    }
    setSaving(false);
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ImagePlus className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vitrine</h1>
            <p className="text-muted-foreground">Gérer la photo de la vitrine affichée sur la page d'accueil</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Photo de la vitrine</CardTitle>
            <CardDescription>Glissez-déposez une image ou cliquez pour en sélectionner une</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`relative border-2 border-dashed rounded-lg transition-colors cursor-pointer min-h-[250px] flex items-center justify-center ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
              }`}
              onClick={() => document.getElementById("vitrine-upload")?.click()}
            >
              <input
                id="vitrine-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  <p>Upload en cours...</p>
                </div>
              ) : imageUrl ? (
                <div className="relative w-full">
                  <img
                    src={imageUrl}
                    alt="Vitrine"
                    className="w-full h-auto max-h-[400px] object-contain rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
                  <Upload className="h-12 w-12" />
                  <p className="text-center font-medium">Glissez-déposez une image ici</p>
                  <p className="text-sm">ou cliquez pour parcourir</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description de la vitrine</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez la vitrine actuelle..."
                rows={3}
              />
            </div>

            {/* Credits */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Crédits</label>
              <Input
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="Réalisé par..."
              />
            </div>

            {/* Save button */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminVitrine;
