import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, GripVertical, ExternalLink, FileText, Link as LinkIcon } from 'lucide-react';

interface CompteRendu {
  id: string;
  title: string;
  file_url: string | null;
  link_url: string | null;
  date: string;
  created_at: string;
  order_index: number;
}

interface SortableConseilCardProps {
  cr: CompteRendu;
  onEdit: (cr: CompteRendu) => void;
  onDelete: (id: string, fileUrl: string | null) => void;
}

export const SortableConseilCard = ({ cr, onEdit, onDelete }: SortableConseilCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cr.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const isLink = !!cr.link_url;
  const displayUrl = cr.link_url || cr.file_url;

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div 
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 px-2">
            <CardTitle className="text-lg line-clamp-2">{cr.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(cr.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(cr)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(cr.id, cr.file_url)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <a 
          href={displayUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          {isLink ? (
            <>
              <LinkIcon className="h-4 w-4" />
              Voir le lien
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Voir le document
            </>
          )}
        </a>
      </CardContent>
    </Card>
  );
};
