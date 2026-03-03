import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PropertyInitalData } from "../../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
}

const PricingCalendar01 = ({ formData, onChange }: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Base Service Pricing
          </h2>
          <p className="text-muted-foreground">
            Set your base prices for main services
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {formData.baseServices.map((service, index) => (
            <div key={index} className="bg-secondary/50 rounded-xl p-4 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input
                    placeholder="e.g., Basic Grooming"
                    value={service.name}
                    onChange={(e) => {
                      const newServices = [...formData.baseServices];
                      newServices[index].name = e.target.value;
                      onChange({ baseServices: newServices });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price Type</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md h-10"
                    value={service.priceType}
                    onChange={(e) => {
                      const newServices = [...formData.baseServices];
                      newServices[index].priceType = e.target.value;
                      onChange({ baseServices: newServices });
                    }}
                  >
                    <option value="Fixed price">Fixed price</option>
                    <option value="Starting from">Starting from</option>
                  </select>
                </div>
                {service.priceType === "Starting from" ? (
                  <>
                    <div className="space-y-2">
                      <Label>Min Price</Label>
                      <Input
                        placeholder="₱800"
                        value={service.minPrice}
                        onChange={(e) => {
                          const newServices = [...formData.baseServices];
                          newServices[index].minPrice = e.target.value;
                          onChange({ baseServices: newServices });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Price</Label>
                      <Input
                        placeholder="₱1,500"
                        value={service.maxPrice}
                        onChange={(e) => {
                          const newServices = [...formData.baseServices];
                          newServices[index].maxPrice = e.target.value;
                          onChange({ baseServices: newServices });
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        placeholder="₱1,200"
                        value={service.price}
                        onChange={(e) => {
                          const newServices = [...formData.baseServices];
                          newServices[index].price = e.target.value;
                          onChange({ baseServices: newServices });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        placeholder="1–1.5 hrs"
                        value={service.duration}
                        onChange={(e) => {
                          const newServices = [...formData.baseServices];
                          newServices[index].duration = e.target.value;
                          onChange({ baseServices: newServices });
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
              {service.priceType === "Starting from" && (
                <div className="mt-4">
                  <Label>Duration</Label>
                  <Input
                    placeholder="1–1.5 hrs"
                    value={service.duration}
                    onChange={(e) => {
                      const newServices = [...formData.baseServices];
                      newServices[index].duration = e.target.value;
                      onChange({ baseServices: newServices });
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => onChange({
              baseServices: [...formData.baseServices, { name: "", priceType: "Fixed price", price: "", minPrice: "", maxPrice: "", duration: "" }]
            })}
            className="mb-4"
          >
            + Add Service
          </Button>
          <p className="text-sm text-muted-foreground">
            Add another service to expand your offerings
          </p>
        </div>
      </div>
    </div>
  )
}

export default PricingCalendar01;