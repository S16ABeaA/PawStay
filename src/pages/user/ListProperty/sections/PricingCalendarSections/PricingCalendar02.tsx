import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PropertyTypeId } from "../../static/propertyTypeIDs";
import { ADD_ON_OPTIONS } from "../../static/addOnOptions";

import { PropertyInitalData } from "../../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
  selectedTypes: PropertyTypeId[];
}

const PricingCalendar02 = ({ formData, onChange, selectedTypes }: Props) => {
  const visibleAddOns = ADD_ON_OPTIONS.filter(
    (addon) => !addon.types || addon.types.some((type) => selectedTypes.includes(type)),
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Add-Ons & Extras
          </h2>
          <p className="text-muted-foreground">
            Extras increase your booking value
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleAddOns.map((addon) => {
            const addonName = addon.name;
            const existingAddon = formData.addOns.find(a => a.name === addonName);
            const isEnabled = !!existingAddon;
            return (
              <div 
                key={addonName} 
                className="bg-secondary/50 rounded-xl p-4 border border-border cursor-pointer hover:bg-secondary/70 transition-colors"
                onClick={() => {
                  if (isEnabled) {
                    onChange({
                      addOns: formData.addOns.filter(a => a.name !== addonName)
                    });
                  } else {
                    onChange({
                      addOns: [...formData.addOns, { name: addonName, price: "", type: "One-time" }]
                    });
                  }
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">{addonName}</Label>
                  <input
                    type="checkbox"
                    className="w-5 h-5 pointer-events-none"
                    checked={isEnabled}
                    readOnly
                  />
                </div>
                {isEnabled && (
                  <div className="space-y-3 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder="Price"
                      value={existingAddon.price}
                      onChange={(e) => {
                        const newAddons = formData.addOns.map(a =>
                          a.name === addonName ? { ...a, price: e.target.value } : a
                        );
                        onChange({ addOns: newAddons });
                      }}
                    />
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={existingAddon.type}
                      onChange={(e) => {
                        const newAddons = formData.addOns.map(a =>
                          a.name === addonName ? { ...a, type: e.target.value } : a
                        );
                        onChange({ addOns: newAddons });
                      }}
                    >
                      <option value="One-time">One-time</option>
                      <option value="Per-day">Per-day</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export default PricingCalendar02;