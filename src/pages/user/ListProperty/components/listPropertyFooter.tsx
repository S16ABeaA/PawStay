import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  currentStep: number;
  establishmentStep: number;
  handleNext: () => void;
  handleBack: () => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
}

const ListPropertyFooter = ({currentStep, establishmentStep, handleNext, handleBack, handleSubmit, isSubmitting}: Props) => {
  return (
    <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border -mx-6 -mb-6 px-6 py-4 mt-8">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={(currentStep === 1 && establishmentStep === 1) || isSubmitting}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {currentStep === 2 ? (
          <Button
            variant="hero"
            onClick={handleNext}
            className="gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : currentStep < 6 ? (
          <Button
            variant="hero"
            onClick={handleNext}
            className="gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                Submitting...
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </>
            ) : (
              <>
                Submit Application
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export default ListPropertyFooter;
