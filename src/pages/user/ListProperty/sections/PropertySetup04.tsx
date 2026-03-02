import { Label } from "@/components/ui/label";

import { PropertyTypeId } from "../static/propertyTypeIDs";
import { BOOKING_RULE_OPTIONS } from "../static/bookingRuleOptions";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
  selectedTypes: PropertyTypeId[];
}

const PropertySetup04 = ({ formData, onChange, selectedTypes }: Props) => {
  const visibleBookingRules = BOOKING_RULE_OPTIONS.filter(
    (rule) => !rule.types || rule.types.some((type) => selectedTypes.includes(type)),
  )
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Booking Rules & Policies
          </h2>
          <p className="text-muted-foreground">
            Set your booking requirements and policies
          </p>
        </div>

        <div className="space-y-8">
          {/* Booking Rules */}
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-6">Booking Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleBookingRules.map((rule) => (
                <div
                  key={rule.name}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                  onClick={() => {
                    const newRules = formData.bookingRules.includes(rule.name)
                      ? formData.bookingRules.filter(r => r !== rule.name)
                      : [...formData.bookingRules, rule.name];
                    onChange({ bookingRules: newRules });
                  }}
                >
                  <div>
                    <Label className="text-sm font-medium">{rule.name}</Label>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={formData.bookingRules.includes(rule.name)}
                    onChange={(e) => {
                      const newRules = formData.bookingRules.includes(rule.name)
                        ? formData.bookingRules.filter(r => r !== rule.name)
                        : [...formData.bookingRules, rule.name];
                      onChange({ bookingRules: newRules });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Requirements */}
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-6">Compliance Requirements</h3>
            <div className="space-y-4">
              {[
                { name: "Vaccination records required", required: true, description: "Proof of up-to-date vaccinations" },
                { name: "Health certificate required", required: false, description: "Vet health check certificate" },
                { name: "Parasite prevention proof", required: false, description: "Flea/tick/heartworm prevention" },
                { name: "Microchip identification", required: false, description: "Pet must have microchip ID" },
                { name: "Breed-specific restrictions apply", required: false, description: "Certain breeds not accepted" },
                { name: "Age restrictions apply", required: false, description: "Minimum/maximum pet age" }
              ].map((requirement) => (
                <div
                  key={requirement.name}
                  className="flex items-start gap-3 p-3 bg-background rounded-lg border cursor-pointer"
                  onClick={() => {
                    const newRequirements = formData.complianceRequirements?.includes(requirement.name)
                      ? formData.complianceRequirements.filter(r => r !== requirement.name)
                      : [...(formData.complianceRequirements || []), requirement.name];
                    onChange({ complianceRequirements: newRequirements });
                  }}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 mt-1"
                    checked={formData.complianceRequirements?.includes(requirement.name) || false}
                    onChange={(e) => {
                      const newRequirements = formData.complianceRequirements?.includes(requirement.name)
                        ? formData.complianceRequirements.filter(r => r !== requirement.name)
                        : [...(formData.complianceRequirements || []), requirement.name];
                      onChange({ complianceRequirements: newRequirements });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{requirement.name}</Label>
                      {requirement.required && <span className="text-red-500 text-xs">*</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{requirement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertySetup04;