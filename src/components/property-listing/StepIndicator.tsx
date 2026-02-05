import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  establishmentSubstep?: number;
}

const StepIndicator = ({ steps, currentStep, establishmentSubstep = 1 }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-8">
      {steps.map((step, index) => {
        const isEstablishmentInfo = step.title === "Establishment Info";
        const establishmentFirstComplete = establishmentSubstep >= 2 || currentStep > 1;
        const establishmentSecondComplete = currentStep > 1;
        const establishmentComplete = currentStep > 1;
        const isStepComplete = isEstablishmentInfo
          ? establishmentComplete
          : currentStep > step.number;
        const isStepActive = isEstablishmentInfo
          ? currentStep === 1
          : currentStep === step.number;

        return (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                  isStepComplete
                    ? "bg-success text-success-foreground"
                    : isStepActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {isStepComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              {
                !isEstablishmentInfo && (
                <span
                  className={cn(
                    "text-xs mt-2 font-medium hidden sm:block",
                    currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              )
              }
              {isEstablishmentInfo && (
                <span
                  className={cn(
                    "text-xs mt-2 font-medium hidden sm:block",
                    currentStep >= 1 ? "text-foreground" : "text-muted-foreground"
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
                      establishmentFirstComplete ? "bg-primary" : "bg-secondary"
                    )}
                  />
                  <span
                    className={cn(
                      "h-1.5 w-8 rounded-full",
                      establishmentSecondComplete ? "bg-primary" : "bg-secondary"
                    )}
                  />
                </div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2 rounded-full",
                  isStepComplete ? "bg-success" : "bg-secondary"
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
