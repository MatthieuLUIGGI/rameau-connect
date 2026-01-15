/**
 * Utilitaire d'optimisation d'images éco-responsable
 * - Compression automatique des images lourdes
 * - Conversion en format AVIF (avec fallback WebP si non supporté)
 */

// Taille maximale avant compression (500KB)
const MAX_SIZE_BEFORE_COMPRESSION = 500 * 1024;

// Qualité de compression (0-1)
const COMPRESSION_QUALITY = 0.8;

// Dimensions maximales
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

/**
 * Vérifie si le navigateur supporte le format AVIF
 */
export const supportsAvif = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avifImage = new Image();
    avifImage.onload = () => resolve(true);
    avifImage.onerror = () => resolve(false);
    // Image AVIF 1x1 pixel encodée en base64
    avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIyExAAAAAP+j9MgAAAAAHWAAAA';
  });
};

/**
 * Charge une image à partir d'un fichier
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Redimensionne l'image si nécessaire
 */
const calculateDimensions = (
  width: number,
  height: number
): { width: number; height: number } => {
  let newWidth = width;
  let newHeight = height;

  if (width > MAX_WIDTH) {
    newWidth = MAX_WIDTH;
    newHeight = (height * MAX_WIDTH) / width;
  }

  if (newHeight > MAX_HEIGHT) {
    newHeight = MAX_HEIGHT;
    newWidth = (newWidth * MAX_HEIGHT) / newHeight;
  }

  return { width: Math.round(newWidth), height: Math.round(newHeight) };
};

/**
 * Convertit un canvas en Blob avec le format spécifié
 */
const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      mimeType,
      quality
    );
  });
};

/**
 * Optimise et convertit une image
 * @param file - Le fichier image original
 * @returns Le fichier optimisé (AVIF ou WebP) et son extension
 */
export const optimizeImage = async (
  file: File
): Promise<{ blob: Blob; extension: string; originalSize: number; optimizedSize: number }> => {
  const originalSize = file.size;
  
  // Charger l'image
  const img = await loadImage(file);
  
  // Calculer les nouvelles dimensions
  const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight);
  
  // Créer le canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Impossible de créer le contexte canvas');
  }
  
  // Dessiner l'image redimensionnée
  ctx.drawImage(img, 0, 0, width, height);
  
  // Nettoyer l'URL de l'objet
  URL.revokeObjectURL(img.src);
  
  // Déterminer le format de sortie
  const useAvif = await supportsAvif();
  
  let blob: Blob | null = null;
  let extension = 'webp';
  
  if (useAvif) {
    // Essayer AVIF d'abord
    blob = await canvasToBlob(canvas, 'image/avif', COMPRESSION_QUALITY);
    if (blob) {
      extension = 'avif';
    }
  }
  
  // Fallback vers WebP si AVIF n'est pas disponible ou a échoué
  if (!blob) {
    blob = await canvasToBlob(canvas, 'image/webp', COMPRESSION_QUALITY);
    extension = 'webp';
  }
  
  // Fallback vers JPEG si WebP échoue aussi
  if (!blob) {
    blob = await canvasToBlob(canvas, 'image/jpeg', COMPRESSION_QUALITY);
    extension = 'jpg';
  }
  
  if (!blob) {
    throw new Error('Impossible de convertir l\'image');
  }
  
  return {
    blob,
    extension,
    originalSize,
    optimizedSize: blob.size
  };
};

/**
 * Vérifie si un fichier nécessite une optimisation
 */
export const needsOptimization = (file: File): boolean => {
  // Optimiser si le fichier dépasse la taille maximale
  if (file.size > MAX_SIZE_BEFORE_COMPRESSION) {
    return true;
  }
  
  // Optimiser si ce n'est pas déjà un format optimisé
  const optimizedFormats = ['image/avif', 'image/webp'];
  return !optimizedFormats.includes(file.type);
};

/**
 * Formate la taille en Ko ou Mo lisible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} octets`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
};

/**
 * Calcule le pourcentage de réduction
 */
export const calculateReduction = (original: number, optimized: number): number => {
  return Math.round(((original - optimized) / original) * 100);
};
