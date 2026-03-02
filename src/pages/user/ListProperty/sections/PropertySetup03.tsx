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

const PropertySetup03 = ({ formData, onChange, hasBoarding, hasGrooming, hasVet }: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Operating Hours & Availability
          </h2>
          <p className="text-muted-foreground">
            Set your operating hours and availability details
          </p>
        </div>

        <div className="space-y-8">
          {/* Operating Hours */}
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-6">Operating Hours</h3>
            
              <div className="space-y-4">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onChange({ sameHoursEveryDay: !formData.sameHoursEveryDay })}
              >
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={formData.sameHoursEveryDay || false}
                  onChange={(e) => onChange({ sameHoursEveryDay: e.target.checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label className="text-sm font-medium">Same hours every day</Label>
              </div>

              {formData.sameHoursEveryDay ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                  <div className="space-y-2">
                    <Label>Open Time</Label>
                    <Input
                      type="time"
                      value={formData.dailyOpenTime || ""}
                      onChange={(e) => onChange({ dailyOpenTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Close Time</Label>
                    <Input
                      type="time"
                      value={formData.dailyCloseTime || ""}
                      onChange={(e) => onChange({ dailyCloseTime: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 ml-8">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <Label className="text-sm font-medium">{day}</Label>
                      <Input
                        type="time"
                        placeholder="Open"
                        value={formData.weeklyHours?.[day]?.open || ""}
                        onChange={(e) => onChange({
                          weeklyHours: {
                            ...formData.weeklyHours,
                            [day]: { ...formData.weeklyHours?.[day], open: e.target.value }
                          }
                        })}
                      />
                      <Input
                        type="time"
                        placeholder="Close"
                        value={formData.weeklyHours?.[day]?.close || ""}
                        onChange={(e) => onChange({
                          weeklyHours: {
                            ...formData.weeklyHours,
                            [day]: { ...formData.weeklyHours?.[day], close: e.target.value }
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-6">Availability</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                onClick={() => onChange({ weekendAvailability: !formData.weekendAvailability })}
              >
                <div>
                  <Label className="text-sm font-medium">Weekend availability</Label>
                  <p className="text-xs text-muted-foreground">Open on weekends</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={formData.weekendAvailability || false}
                  onChange={(e) => onChange({ weekendAvailability: e.target.checked })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div
                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                onClick={() => onChange({ holidayAvailability: !formData.holidayAvailability })}
              >
                <div>
                  <Label className="text-sm font-medium">Holiday availability</Label>
                  <p className="text-xs text-muted-foreground">Open on holidays</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={formData.holidayAvailability || false}
                  onChange={(e) => onChange({ holidayAvailability: e.target.checked })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {hasVet && (
                <div
                  className="flex items-center justify-between p-3 bg-background rounded-lg border md:col-span-2 cursor-pointer"
                  onClick={() => onChange({ emergencyServices: !formData.emergencyServices })}
                >
                  <div>
                    <Label className="text-sm font-medium">24/7 emergency services</Label>
                    <p className="text-xs text-muted-foreground">Available for emergencies</p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={formData.emergencyServices || false}
                    onChange={(e) => onChange({ emergencyServices: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Boarding Rules */}
          {hasBoarding && (
            <div className="bg-secondary/30 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-6">Boarding Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Check-in cut-off</Label>
                  <Input
                    type="time"
                    placeholder="6:00 PM"
                    value={formData.checkInCutoff || ""}
                    onChange={(e) => onChange({ checkInCutoff: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pick-up window start</Label>
                  <Input
                    type="time"
                    placeholder="8:00 AM"
                    value={formData.pickupStart || ""}
                    onChange={(e) => onChange({ pickupStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pick-up window end</Label>
                  <Input
                    type="time"
                    placeholder="6:00 PM"
                    value={formData.pickupEnd || ""}
                    onChange={(e) => onChange({ pickupEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Booking Type */}
          {(hasGrooming || hasVet) && (
            <div className="bg-secondary/30 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-6">Booking Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.appointmentOnly === "appointment"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                  onClick={() => onChange({ appointmentOnly: "appointment" })}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📅</div>
                    <div className="text-sm font-medium">Appointment-only</div>
                    <div className="text-xs text-muted-foreground mt-1">Scheduled bookings only</div>
                  </div>
                </div>
                <div
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.appointmentOnly === "walkins"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                  onClick={() => onChange({ appointmentOnly: "walkins" })}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🚶</div>
                    <div className="text-sm font-medium">Walk-ins accepted</div>
                    <div className="text-xs text-muted-foreground mt-1">Accept same-day visits</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertySetup03;