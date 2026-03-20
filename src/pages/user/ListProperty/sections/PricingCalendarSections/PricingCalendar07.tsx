import { Textarea } from "@/components/ui/textarea";

import { PropertyTypeId } from "../../static/propertyTypeIDs";
import { PRICING_DISCLAIMER_OPTIONS } from "../../static/priceDisclaimerOptions";

import { PropertyInitalData } from "../../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
  selectedTypes: PropertyTypeId[];
}

const PricingCalendar07 = ({ formData, onChange, selectedTypes }: Props) => {
  const visiblePricingDisclaimers = PRICING_DISCLAIMER_OPTIONS.filter(
    (disclaimer) => !disclaimer.types || disclaimer.types.some((type) => selectedTypes.includes(type)),
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Pricing Notes
          </h2>
          <p className="text-muted-foreground">
            Add any additional pricing notes or disclaimers
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Common Disclaimers</h3>
            <div className="space-y-3">
              {visiblePricingDisclaimers.map((disclaimer) => (
                <label key={disclaimer.name} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4"
                    checked={formData.pricingNotes?.includes(disclaimer.name) || false}
                    onChange={(e) => {
                      const currentNotes = formData.pricingNotes || "";
                      const newNotes = e.target.checked
                        ? currentNotes + (currentNotes ? "\n" : "") + disclaimer.name
                        : currentNotes.split("\n").filter(note => note !== disclaimer.name).join("\n");
                      onChange({ pricingNotes: newNotes });
                    }}
                  />
                  <span className="text-sm text-muted-foreground">{disclaimer.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
            <Textarea
              placeholder="Add any other pricing information, special conditions, or important notes for customers..."
              value={formData.additionalPricingNotes || ""}
              onChange={(e) => onChange({ additionalPricingNotes: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingCalendar07;