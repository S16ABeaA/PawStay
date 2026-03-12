import { useAdminProperty } from "@/hooks/useAdminProperty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";

const BusinessSelector = () => {
  const { properties, selectedPropertyId, setSelectedPropertyId, loading } = useAdminProperty();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  // Only show selector when there are 2+ properties
  if (properties.length <= 1) {
    if (properties.length === 1) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground truncate max-w-[200px] whitespace-nowrap">
            {properties[0].name}
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-primary shrink-0" />
      <Select value={selectedPropertyId ?? ""} onValueChange={setSelectedPropertyId}>
        <SelectTrigger className="w-[220px] h-9 text-sm font-medium truncate overflow-hidden whitespace-nowrap">
          <SelectValue placeholder="Select business" />
        </SelectTrigger>
        <SelectContent>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate flex-1 min-w-0">{p.name}</span>
                {p.city && (
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2 whitespace-nowrap">— {p.city}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BusinessSelector;
