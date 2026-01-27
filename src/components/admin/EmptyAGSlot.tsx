import { Card, CardContent } from '@/components/ui/card';
import { DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface EmptyAGSlotProps {
  onAdd: () => void;
}

export const EmptyAGSlot = ({ onAdd }: EmptyAGSlotProps) => {
  return (
    <DialogTrigger asChild>
      <Card 
        className="border-dashed border-2 border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-colors"
        onClick={onAdd}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-2">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">Ajouter un compte rendu</span>
        </CardContent>
      </Card>
    </DialogTrigger>
  );
};
