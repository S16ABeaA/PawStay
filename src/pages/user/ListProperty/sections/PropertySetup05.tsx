import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
  hasBoarding: boolean;
  hasGrooming: boolean;
  hasVet: boolean;
}

const PropertySetup05 = ({ formData, onChange, hasBoarding, hasGrooming, hasVet }: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Health & Safety
          </h2>
          <p className="text-muted-foreground">
            Outline your health and safety protocols
          </p>
        </div>

        <div className="space-y-6">
          {/* Vaccination & Parasite Requirements */}
          {(hasBoarding || hasGrooming) && (
            <div className="bg-secondary/30 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-4">Vaccination & Parasite Requirements</h3>
              <div className="space-y-4">
                {[
                  "DHPP vaccination (Distemper, Hepatitis, Parvovirus, Parainfluenza)",
                  "Rabies vaccination",
                  "Bordetella vaccination (Kennel Cough)",
                  "Leptospirosis vaccination",
                  "Heartworm prevention",
                  "Flea and tick prevention",
                  "Internal parasite prevention"
                ].map((requirement) => (
                  <div
                    key={requirement}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                    onClick={() => {
                      const newRequirements = formData.healthSafety.includes(requirement)
                        ? formData.healthSafety.filter(r => r !== requirement)
                        : [...formData.healthSafety, requirement];
                      onChange({ healthSafety: newRequirements });
                    }}
                  >
                    <div>
                      <Label className="text-sm font-medium">{requirement}</Label>
                      <p className="text-xs text-muted-foreground">Required for all pets</p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5"
                      checked={formData.healthSafety.includes(requirement)}
                      onChange={(e) => {
                        const newRequirements = formData.healthSafety.includes(requirement)
                          ? formData.healthSafety.filter(r => r !== requirement)
                          : [...formData.healthSafety, requirement];
                        onChange({ healthSafety: newRequirements });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Procedures */}
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Emergency Procedures</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Emergency contact number</Label>
                <Input
                  placeholder="+63 XXX XXX XXXX"
                  value={formData.emergencyContact || ""}
                  onChange={(e) => onChange({ emergencyContact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nearest veterinary hospital</Label>
                <Input
                  placeholder="Hospital name and address"
                  value={formData.nearestVetHospital || ""}
                  onChange={(e) => onChange({ nearestVetHospital: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Emergency response time</Label>
                <Input
                  placeholder="Within 30 minutes"
                  value={formData.emergencyResponseTime || ""}
                  onChange={(e) => onChange({ emergencyResponseTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Vet Availability */}
          {(hasVet || hasBoarding) && (
            <div className="bg-secondary/30 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-4">Vet Availability</h3>
              <div className="space-y-4">
                {[
                  "On-site veterinarian available",
                  "24/7 vet on-call service",
                  "Emergency vet clinic partnership",
                  "Telemedicine consultations",
                  "Mobile vet services"
                ].map((service) => (
                  <div
                    key={service}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                    onClick={() => {
                      const newServices = formData.vetAvailability?.includes(service)
                        ? formData.vetAvailability.filter(s => s !== service)
                        : [...(formData.vetAvailability || []), service];
                      onChange({ vetAvailability: newServices });
                    }}
                  >
                    <div>
                      <Label className="text-sm font-medium">{service}</Label>
                      <p className="text-xs text-muted-foreground">
                        {service === "On-site veterinarian available" && "Vet present at facility"}
                        {service === "24/7 vet on-call service" && "Emergency vet support"}
                        {service === "Emergency vet clinic partnership" && "Affiliated with emergency clinic"}
                        {service === "Telemedicine consultations" && "Remote vet consultations"}
                        {service === "Mobile vet services" && "Vet visits facility"}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5"
                      checked={formData.vetAvailability?.includes(service) || false}
                      onChange={(e) => {
                        const newServices = formData.vetAvailability?.includes(service)
                          ? formData.vetAvailability.filter(s => s !== service)
                          : [...(formData.vetAvailability || []), service];
                        onChange({ vetAvailability: newServices });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Isolation & Sanitation Protocols */}
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Isolation & Sanitation Protocols</h3>
            <div className="space-y-4">
              {[
                "Separate isolation area for sick pets",
                "Quarantine period for new arrivals",
                "Daily health monitoring",
                "Sanitation between pets",
                "Disinfection protocols",
                "Waste disposal procedures",
                "Hand washing stations",
                "PPE availability"
                ].map((protocol) => (
                <div
                  key={protocol}
                  className="flex items-start gap-3 p-3 bg-background rounded-lg border cursor-pointer"
                  onClick={() => {
                    const newProtocols = formData.sanitationProtocols?.includes(protocol)
                      ? formData.sanitationProtocols.filter(p => p !== protocol)
                      : [...(formData.sanitationProtocols || []), protocol];
                    onChange({ sanitationProtocols: newProtocols });
                  }}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 mt-1"
                    checked={formData.sanitationProtocols?.includes(protocol) || false}
                    onChange={(e) => {
                      const newProtocols = formData.sanitationProtocols?.includes(protocol)
                        ? formData.sanitationProtocols.filter(p => p !== protocol)
                        : [...(formData.sanitationProtocols || []), protocol];
                      onChange({ sanitationProtocols: newProtocols });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{protocol}</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {protocol === "Separate isolation area for sick pets" && "Isolated space for ill animals"}
                      {protocol === "Quarantine period for new arrivals" && "Observation period before mixing"}
                      {protocol === "Daily health monitoring" && "Regular health checks"}
                      {protocol === "Sanitation between pets" && "Cleaning between animals"}
                      {protocol === "Disinfection protocols" && "Proper disinfection procedures"}
                      {protocol === "Waste disposal procedures" && "Safe waste handling"}
                      {protocol === "Hand washing stations" && "Hygiene facilities"}
                      {protocol === "PPE availability" && "Protective equipment"}
                    </p>
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

export default PropertySetup05;