import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
  hasBoarding: boolean;
  hasGrooming: boolean;
}

const PropertySetup01 = ({ formData, onChange, hasBoarding, hasGrooming }: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Pet Types Accepted
          </h2>
          <p className="text-muted-foreground">
            Specify which types of pets you accept and any restrictions
          </p>
        </div>

        <div className="space-y-8">
          {/* Pet Types */}
          <div>
            <h3 className="text-lg font-medium mb-6">Pet Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Dogs", icon: "🐶", sizes: ["Small", "Medium", "Large"] },
                { name: "Cats", icon: "🐱", sizes: null },
                { name: "Exotic Pets", icon: "🐦", sizes: null }
              ].map((type) => {
                const isSelected = formData.petTypesAccepted.includes(type.name);
                return (
                  <div key={type.name} className="space-y-4">
                    <div
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all text-center ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                      onClick={() => {
                        const newTypes = isSelected
                          ? formData.petTypesAccepted.filter(t => t !== type.name)
                          : [...formData.petTypesAccepted, type.name];
                        onChange({ petTypesAccepted: newTypes });
                      }}
                    >
                      <div className="text-4xl mb-2">{type.icon}</div>
                      <div className="text-lg font-medium">{type.name}</div>
                    </div>

                    {isSelected && type.name === "Dogs" && (
                      <div className="bg-secondary/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                        <h4 className="text-sm font-medium mb-3">Dog Sizes Accepted</h4>
                        <div className="flex gap-2">
                          {type.sizes?.map((size) => (
                            <label key={size} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={formData.dogSizes?.includes(size) || false}
                                onChange={(e) => {
                                  const newSizes = e.target.checked
                                    ? [...(formData.dogSizes || []), size]
                                    : (formData.dogSizes || []).filter(s => s !== size);
                                  onChange({ dogSizes: newSizes });
                                }}
                              />
                              <span className="text-sm font-medium">{size}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {isSelected && type.name === "Exotic Pets" && (
                      <div className="bg-secondary/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                        <Label className="text-sm font-medium">Specify Exotic Pet Types</Label>
                        <Input
                          placeholder="e.g., Birds, reptiles, small mammals"
                          value={formData.exoticPetTypes || ""}
                          onChange={(e) => onChange({ exoticPetTypes: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Policies */}
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-6">Policies</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Breed restrictions</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.breedRestrictions ? "Yes" : "No"}
                    onChange={(e) => {
                      if (e.target.value === "No") {
                        onChange({ breedRestrictions: false, breedRestrictionDetails: "" });
                      } else {
                        onChange({ breedRestrictions: true });
                      }
                    }}
                  >
                    <option value="No">No restrictions</option>
                    <option value="Yes">Has restrictions</option>
                  </select>
                  {formData.breedRestrictions && (
                    <Input
                      placeholder="e.g., No pit bulls, no aggressive breeds"
                      value={formData.breedRestrictionDetails || ""}
                      onChange={(e) => onChange({ breedRestrictionDetails: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Aggressive pet policy</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.aggressivePolicy ? "Yes" : "No"}
                    onChange={(e) => {
                      if (e.target.value === "No") {
                        onChange({ aggressivePolicy: false, aggressivePolicyDetails: "" });
                      } else {
                        onChange({ aggressivePolicy: true });
                      }
                    }}
                  >
                    <option value="No">Accept all pets</option>
                    <option value="Yes">Has policy</option>
                  </select>
                  {formData.aggressivePolicy && (
                    <Input
                      placeholder="Describe your policy for aggressive pets"
                      value={formData.aggressivePolicyDetails || ""}
                      onChange={(e) => onChange({ aggressivePolicyDetails: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Unvaccinated pet policy</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.unvaccinatedPolicy ? "Yes" : "No"}
                  onChange={(e) => {
                    if (e.target.value === "No") {
                      onChange({ unvaccinatedPolicy: false, unvaccinatedPolicyDetails: "" });
                    } else {
                      onChange({ unvaccinatedPolicy: true });
                    }
                  }}
                >
                  <option value="No">Accept unvaccinated pets</option>
                  <option value="Yes">Vaccination required</option>
                </select>
                {formData.unvaccinatedPolicy && (
                  <Input
                    placeholder="Describe vaccination requirements"
                    value={formData.unvaccinatedPolicyDetails || ""}
                    onChange={(e) => onChange({ unvaccinatedPolicyDetails: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Capacity Section - Boarding & Grooming/Salon */}
          {(hasBoarding || hasGrooming) && (
            <div className="bg-secondary/30 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-2">Capacity</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {hasBoarding && !hasGrooming && "Set your overall facility capacity and the number of animals each room type or service can accommodate."}
                {hasGrooming && !hasBoarding && "Set the total number of grooming slots available and per-service simultaneous capacity."}
                {hasBoarding && hasGrooming && "Set the total facility capacity and per-service capacity for boarding and grooming."}
              </p>

              {/* Overall property-level capacity → properties.capacity */}
              <div className="mb-6 p-4 bg-background rounded-lg border space-y-1">
                <Label className="text-sm font-medium">
                  {hasBoarding && !hasGrooming && "Total animal capacity (entire facility)"}
                  {hasGrooming && !hasBoarding && "Total grooming slots (concurrent animals)"}
                  {hasBoarding && hasGrooming && "Total facility capacity (all services combined)"}
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {hasBoarding && !hasGrooming && "Maximum number of animals that can stay at your facility at any one time."}
                  {hasGrooming && !hasBoarding && "Maximum number of pets your salon can handle simultaneously across all stations."}
                  {hasBoarding && hasGrooming && "Overall maximum concurrent animals across boarding and grooming at one time."}
                </p>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g., 20"
                  value={formData.animalCapacity === 0 ? "" : formData.animalCapacity}
                  onChange={(e) => onChange({ animalCapacity: parseInt(e.target.value) || 0 })}
                  className="max-w-xs"
                />
              </div>

              <h4 className="text-sm font-semibold mb-3 text-foreground">
                Per-service / room-type capacity <span className="font-normal text-muted-foreground">(stored in property_services.capacity)</span>
              </h4>

              <div className="space-y-3 mb-4">
                {formData.serviceCapacities.map((item, index) => (
                  <div key={index} className="flex items-end gap-3 bg-background rounded-lg border p-4">
                    <div className="flex-1 space-y-1">
                      <Label className="text-sm font-medium">Service / Room Type</Label>
                      <Input
                        placeholder={hasBoarding ? "e.g., Standard Room, Deluxe Suite" : "e.g., Basic Bath & Trim"}
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...formData.serviceCapacities];
                          updated[index].name = e.target.value;
                          onChange({ serviceCapacities: updated });
                        }}
                      />
                    </div>
                    <div className="w-36 space-y-1">
                      <Label className="text-sm font-medium">Capacity (animals)</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g., 5"
                        value={item.capacity === 0 ? "" : item.capacity}
                        onChange={(e) => {
                          const updated = [...formData.serviceCapacities];
                          updated[index].capacity = parseInt(e.target.value) || 0;
                          onChange({ serviceCapacities: updated });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="mb-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => {
                        const updated = formData.serviceCapacities.filter((_, i) => i !== index);
                        onChange({ serviceCapacities: updated });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                onClick={() => onChange({ serviceCapacities: [
                  ...formData.serviceCapacities,
                  { name: "", capacity: 0 },
                ]})}
              >
                + Add service capacity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertySetup01;