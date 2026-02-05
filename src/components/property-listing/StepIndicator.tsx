import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-8">
      {steps.map((step, index) => {
        const isEstablishmentInfo = step.title === "Establishment Info";
        const isDuplicateEstablishmentInfo =
          isEstablishmentInfo && steps[index - 1]?.title === "Establishment Info";

        return (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                  currentStep > step.number
                    ? "bg-success text-success-foreground"
                    : currentStep === step.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              {!isDuplicateEstablishmentInfo && (
                <span
                  className={cn(
                    "text-xs mt-2 font-medium hidden sm:block",
                    currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              )}
              {isEstablishmentInfo && index === 0 && (
                <div className="hidden sm:flex items-center gap-1 mt-2">
                  <span
                    className={cn(
                      "h-1.5 w-8 rounded-full",
                      currentStep >= 1 ? "bg-primary" : "bg-secondary"
                    )}
                  />
                  <span
                    className={cn(
                      "h-1.5 w-8 rounded-full",
                      currentStep >= 2 ? "bg-primary" : "bg-secondary"
                    )}
                  />
                </div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2 rounded-full",
                  currentStep > step.number ? "bg-success" : "bg-secondary"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
