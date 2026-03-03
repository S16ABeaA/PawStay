import { Label } from "@/components/ui/label";

import { PropertyInitalData } from "../../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
}

const PricingCalendar04 = ({ formData, onChange }: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Boarding Rules
          </h2>
          <p className="text-muted-foreground">
            Set your boarding policies and restrictions
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Booking Policies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => onChange({
                  boardingRules: { ...formData.boardingRules, advanceBooking: !formData.boardingRules?.advanceBooking }
                })}
              >
                <div>
                  <Label className="text-sm font-medium">Advance booking required</Label>
                  <p className="text-xs text-muted-foreground">Minimum notice period</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 pointer-events-none"
                  checked={formData.boardingRules?.advanceBooking || false}
                  readOnly
                />
              </div>
              <div 
                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => onChange({
                  boardingRules: { ...formData.boardingRules, sameDayBooking: !formData.boardingRules?.sameDayBooking }
                })}
              >
                <div>
                  <Label className="text-sm font-medium">Same-day booking allowed</Label>
                  <p className="text-xs text-muted-foreground">Accept last-minute bookings</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 pointer-events-none"
                  checked={formData.boardingRules?.sameDayBooking || false}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Pet Restrictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => onChange({
                  boardingRules: { ...formData.boardingRules, vaccinationRequired: !formData.boardingRules?.vaccinationRequired }
                })}
              >
                <div>
                  <Label className="text-sm font-medium">Vaccination required</Label>
                  <p className="text-xs text-muted-foreground">Up-to-date vaccinations</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 pointer-events-none"
                  checked={formData.boardingRules?.vaccinationRequired || false}
                  readOnly
                />
              </div>
              <div 
                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => onChange({
                  boardingRules: { ...formData.boardingRules, healthDeclaration: !formData.boardingRules?.healthDeclaration }
                })}
              >
                <div>
                  <Label className="text-sm font-medium">Health declaration required</Label>
                  <p className="text-xs text-muted-foreground">Vet health certificate</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 pointer-events-none"
                  checked={formData.boardingRules?.healthDeclaration || false}
                  readOnly
                />
              </div>
              <div 
                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => onChange({
                  boardingRules: { ...formData.boardingRules, noAggressivePets: !formData.boardingRules?.noAggressivePets }
                })}
              >
                <div>
                  <Label className="text-sm font-medium">Aggressive behavior policy</Label>
                  <p className="text-xs text-muted-foreground">No aggressive pets</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 pointer-events-none"
                  checked={formData.boardingRules?.noAggressivePets || false}
                  readOnly
                />
              </div>
              <div 
                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => onChange({
                  boardingRules: { ...formData.boardingRules, liabilityWaiver: !formData.boardingRules?.liabilityWaiver }
                })}
              >
                <div>
                  <Label className="text-sm font-medium">Liability waiver required</Label>
                  <p className="text-xs text-muted-foreground">Signed waiver needed</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 pointer-events-none"
                  checked={formData.boardingRules?.liabilityWaiver || false}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingCalendar04;