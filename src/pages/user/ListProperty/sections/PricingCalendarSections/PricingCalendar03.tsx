import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PropertyInitalData } from "../../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
}

const PricingCalendar03 = ({ formData, onChange }: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Veterinary Fees
          </h2>
          <p className="text-muted-foreground">
            Set fees for veterinary services
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Consultation Fees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Initial Consultation</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.initialConsultation || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, initialConsultation: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Follow-up Visit</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.followUpVisit || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, followUpVisit: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Vaccination & Preventive Care</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rabies Vaccination</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.rabiesVaccination || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, rabiesVaccination: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>DHPP Vaccination</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.dhppVaccination || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, dhppVaccination: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heartworm Test</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.heartwormTest || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, heartwormTest: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Flea Treatment</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.fleaTreatment || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, fleaTreatment: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Emergency & Treatment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emergency Visit</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.emergencyVisit || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, emergencyVisit: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Surgery (Minor)</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.minorSurgery || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, minorSurgery: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dental Cleaning</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.dentalCleaning || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, dentalCleaning: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>X-Ray</Label>
                <Input
                  placeholder="₱0"
                  value={formData.vetFees?.xRay || ""}
                  onChange={(e) => onChange({
                    vetFees: { ...formData.vetFees, xRay: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingCalendar03;