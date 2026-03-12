import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

const StatsCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
}: StatsCardProps) => {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-soft h-full">
      <div className="flex flex-col justify-between h-full">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {change && (
              <p
                className={cn(
                  "text-xs mt-2",
                  changeType === "positive" && "text-success",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </p>
            )}
          </div>

          <div className={cn("p-3 rounded-lg bg-secondary ml-4 flex-shrink-0", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {/* spacer ensures consistent spacing if needed */}
        <div className="mt-3" />
      </div>
    </div>
  );
};

export default StatsCard;
