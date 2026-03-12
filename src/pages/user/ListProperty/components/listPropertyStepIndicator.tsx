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
  propertySetupCompleted?: number;
  propertySetupTotal?: number;
  photosCompleted?: boolean;
  pricingCalendarCompleted?: number;
  pricingCalendarTotal?: number;
}

const StepIndicator = ({
  steps,
  currentStep,
  establishmentSubstep = 1,
  propertySetupCompleted = 0,
  propertySetupTotal = 5,
  pricingCalendarCompleted = 0,
  pricingCalendarTotal = 8,
}: StepIndicatorProps) => {
  return (
    <div className="grid grid-cols-3 gap-4 sm:flex sm:items-start sm:justify-evenly sm:gap-0 w-full max-w-4xl mx-auto mb-8 px-4">
      {steps.map((step, index) => {
        const isEstablishmentInfo = step.title === "Establishment Info";
        const isPropertySetup = step.title === "Property Setup";
        const isPricingCalendar = step.title === "Pricing and Calendar";
        const establishmentFirstComplete = currentStep === 1 || establishmentSubstep >= 2 || currentStep > 1;
        const establishmentSecondComplete = establishmentSubstep >= 2 || currentStep > 1;
        const isStepComplete = currentStep > step.number;
        const isStepActive = isEstablishmentInfo
          ? currentStep === 1
          : isPropertySetup
          ? currentStep === 2
          : isPricingCalendar
          ? currentStep === 4
          : currentStep === step.number;

        return (
          <div key={step.number} className="flex flex-col items-center flex-1">
            <div className="flex flex-col items-center min-h-[100px] w-full">
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
                    "text-xs mt-2 font-medium hidden sm:block whitespace-nowrap",
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
                    "text-xs mt-2 font-medium hidden sm:block whitespace-nowrap",
                    step.number === 6 && "4",
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
              {isPropertySetup && index === 1 && (
                <div className="hidden sm:flex items-center gap-1 mt-2">
                  {Array.from({ length: propertySetupTotal }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 w-4 rounded-full",
                        i < propertySetupCompleted ? "bg-primary" : "bg-secondary"
                      )}
                    />
                  ))}
                </div>
              )}
              {isPricingCalendar && index === 3 && (
                <div className="hidden sm:flex items-center gap-1 mt-2">
                  {Array.from({ length: pricingCalendarTotal }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 w-3 rounded-full",
                        i < pricingCalendarCompleted ? "bg-primary" : "bg-secondary"
                      )}
                    />
                  ))}
                </div>
              )}
              {/* Add consistent bottom spacing for steps without sub-indicators */}
              {(!isEstablishmentInfo && !isPropertySetup && !isPricingCalendar) && (
                <div className="mt-2 h-6"></div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "hidden sm:block flex-1 h-1 mx-2 rounded-full",
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
