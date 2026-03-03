import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PropertyInitalData } from "../../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
  hasBoarding: boolean;
  hasGrooming: boolean;
  hasVet: boolean;
}

const PricingCalendar05 = ({ formData, onChange, hasBoarding, hasGrooming, hasVet }: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Fees & Charges
          </h2>
          <p className="text-muted-foreground">
            Set additional fees and charges
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Platform Service Fee</Label>
            <Input
              placeholder="10%"
              value={formData.feesCharges?.serviceFee || ""}
              onChange={(e) => onChange({
                feesCharges: { ...formData.feesCharges, serviceFee: e.target.value }
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>Taxes</Label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.feesCharges?.taxes || "Included"}
              onChange={(e) => onChange({
                feesCharges: { ...formData.feesCharges, taxes: e.target.value }
              })}
            >
              <option value="Included">Included</option>
              <option value="Excluded">Excluded</option>
            </select>
          </div>
          <div className="md:col-span-2 bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Cancellation & Rescheduling</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Free cancellation period *</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.cancellationPolicy?.freeCancellation || "24hours"}
                  onChange={(e) => onChange({
                    cancellationPolicy: { ...formData.cancellationPolicy, freeCancellation: e.target.value }
                  })}
                >
                  <option value="24hours">Up to 24 hours before</option>
                  <option value="48hours">Up to 48 hours before</option>
                  <option value="1week">Up to 1 week before</option>
                  <option value="none">No free cancellation</option>
                </select>
                <p className="text-xs text-muted-foreground">Customers can cancel for free within this period</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Late cancellation fee</Label>
                <Input
                  placeholder="₱500 or 50% of booking"
                  value={formData.cancellationPolicy?.lateFee || ""}
                  onChange={(e) => onChange({
                    cancellationPolicy: { ...formData.cancellationPolicy, lateFee: e.target.value }
                  })}
                />
                <p className="text-xs text-muted-foreground">Fee for cancellations after free period</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">No-show policy</Label>
                <Input
                  placeholder="Full charge or 100% of booking amount"
                  value={formData.cancellationPolicy?.noShow || ""}
                  onChange={(e) => onChange({
                    cancellationPolicy: { ...formData.cancellationPolicy, noShow: e.target.value }
                  })}
                />
                <p className="text-xs text-muted-foreground">What happens if customer doesn't show up</p>
              </div>
            </div>
          </div>
          {hasBoarding && (
            <div className="space-y-2">
              <Label>Late Pickup Fee</Label>
              <Input
                placeholder="₱100 per hour"
                value={formData.feesCharges?.latePickup || ""}
                onChange={(e) => onChange({
                  feesCharges: { ...formData.feesCharges, latePickup: e.target.value }
                })}
              />
            </div>
          )}
          {hasBoarding && (
            <div className="space-y-2">
              <Label>Cleaning Fee</Label>
              <Input
                placeholder="₱200"
                value={formData.feesCharges?.cleaningFee || ""}
                onChange={(e) => onChange({
                  feesCharges: { ...formData.feesCharges, cleaningFee: e.target.value }
                })}
              />
            </div>
          )}
          {(hasVet || hasGrooming) && (
            <div className="space-y-2">
              <Label>Emergency Fee</Label>
              <Input
                placeholder="₱500"
                value={formData.feesCharges?.emergencyFee || ""}
                onChange={(e) => onChange({
                  feesCharges: { ...formData.feesCharges, emergencyFee: e.target.value }
                })}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Holiday Surcharge</Label>
            <Input
              placeholder="20% during holidays"
              value={formData.feesCharges?.holidaySurcharge || ""}
              onChange={(e) => onChange({
                feesCharges: { ...formData.feesCharges, holidaySurcharge: e.target.value }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingCalendar05;