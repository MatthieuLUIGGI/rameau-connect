-- Ajouter une colonne pour stocker la configuration de mise en page des images
ALTER TABLE actualites ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT '{"type": "single", "images": []}'::jsonb;

-- Migrer les données existantes : copier image_url dans layout_config si elle existe
UPDATE actualites 
SET layout_config = jsonb_build_object(
  'type', 'single',
  'images', CASE 
    WHEN image_url IS NOT NULL AND image_url != '' 
    THEN jsonb_build_array(image_url) 
    ELSE '[]'::jsonb 
  END
)
WHERE layout_config IS NULL OR layout_config = '{"type": "single", "images": []}'::jsonb;