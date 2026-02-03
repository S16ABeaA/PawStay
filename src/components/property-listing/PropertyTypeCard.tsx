import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const PropertyTypeCard = ({ icon: Icon, title, description, isSelected, onClick }: PropertyTypeCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-6 rounded-2xl border-2 text-left transition-all hover:border-primary/50 hover:shadow-soft",
        isSelected 
          ? "border-primary bg-primary/5 shadow-soft" 
          : "border-border bg-card"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
      )}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-semibold text-lg text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
};

export default PropertyTypeCard;
