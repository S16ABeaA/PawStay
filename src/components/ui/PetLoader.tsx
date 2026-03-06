import { Dog, Cat } from "lucide-react";
import { cn } from "@/lib/utils";

interface PetLoaderProps {
  className?: string;
  text?: string;
}

export const PetLoader = ({ className, text = "Loading..." }: PetLoaderProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-4 overflow-hidden", className)}>
      <div className="relative w-48 h-12 flex items-center">
        {/* We use arbitrary Tailwind classes for a continuous marquee-like walk animation */}
        <div className="absolute flex gap-4 text-primary animate-[walking_3s_linear_infinite]">
          <Dog className="h-8 w-8 animate-[bounce_1s_ease-in-out_infinite]" />
          <Cat className="h-8 w-8 animate-[bounce_1s_ease-in-out_infinite_0.1s]" />
          <Dog className="h-8 w-8 animate-[bounce_1s_ease-in-out_infinite]" />
          <Cat className="h-8 w-8 animate-[bounce_1s_ease-in-out_infinite_0.1s]" />
        </div>
      </div>
      {text && <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>}
      <style>{`
        @keyframes walking {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};
