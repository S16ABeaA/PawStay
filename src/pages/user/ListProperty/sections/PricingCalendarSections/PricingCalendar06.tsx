import { Upload, X } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";

import { PropertyInitalData } from "../../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
}
const PricingCalendar06 = ({ formData, onChange }: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Payment Options
          </h2>
          <p className="text-muted-foreground">
            Choose accepted payment methods
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Accepted Payment Methods</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: "Credit/Debit", icon: "💳", disabled: false },
                { name: "GCash", icon: "📱", disabled: false },
                { name: "PayMaya", icon: "📱", disabled: false },
                { name: "Cash", icon: "💵", disabled: false },
                { name: "Bank Transfer", icon: "🏦", disabled: true }
              ].map((method) => (
                <div
                  key={method.name}
                  className={`relative p-4 border-2 rounded-xl transition-all ${
                    method.disabled
                      ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                      : formData.paymentOptions?.methods?.includes(method.name)
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-border hover:border-primary/30 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (method.disabled) return;
                    const methods = formData.paymentOptions?.methods?.includes(method.name)
                      ? formData.paymentOptions.methods.filter(m => m !== method.name)
                      : [...(formData.paymentOptions?.methods || []), method.name];
                    onChange({
                      paymentOptions: { ...formData.paymentOptions, methods }
                    });
                  }}
                >
                  {method.disabled && (
                    <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-muted-foreground text-white rounded-full font-medium">Soon</span>
                  )}
                  <div className="text-center">
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <div className="text-sm font-medium">{method.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GCash QR Code Upload */}
          {formData.paymentOptions?.methods?.includes("GCash") && (
            <div className="bg-secondary/30 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-2">GCash QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload a QR code image for GCash payments. Customers will see this when paying via GCash.</p>
              <div className="flex items-center gap-4">
                {formData.paymentOptions.qrCodeGCash ? (
                  <div className="relative">
                    <img src={formData.paymentOptions.qrCodeGCash} alt="GCash QR" className="w-40 h-40 object-contain rounded-lg border border-border bg-white p-2" />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/80"
                      onClick={() => onChange({ paymentOptions: { ...formData.paymentOptions, qrCodeGCash: "" } })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground text-center">Upload GCash<br />QR Code</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onChange({ paymentOptions: { ...formData.paymentOptions, qrCodeGCash: reader.result as string } });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* PayMaya QR Code Upload */}
          {formData.paymentOptions?.methods?.includes("PayMaya") && (
            <div className="bg-secondary/30 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-2">PayMaya QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload a QR code image for PayMaya payments. Customers will see this when paying via PayMaya.</p>
              <div className="flex items-center gap-4">
                {formData.paymentOptions.qrCodePayMaya ? (
                  <div className="relative">
                    <img src={formData.paymentOptions.qrCodePayMaya} alt="PayMaya QR" className="w-40 h-40 object-contain rounded-lg border border-border bg-white p-2" />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/80"
                      onClick={() => onChange({ paymentOptions: { ...formData.paymentOptions, qrCodePayMaya: "" } })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground text-center">Upload PayMaya<br />QR Code</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onChange({ paymentOptions: { ...formData.paymentOptions, qrCodePayMaya: reader.result as string } });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Deposit Requirements</h3>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm font-medium">Require deposit for bookings</div>
                <p className="text-xs text-muted-foreground">Deposit amount will be set separately</p>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5"
                checked={formData.paymentOptions?.deposit || false}
                onChange={(e) => onChange({
                  paymentOptions: { ...formData.paymentOptions, deposit: e.target.checked }
                })}
              />
            </label>
          </div>

          <div className="bg-secondary/30 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Refund Policy</h3>
            <Textarea
              placeholder="Full refund if cancelled 24hrs in advance. 50% refund for cancellations within 24hrs. No refund for no-shows."
              value={formData.paymentOptions?.refundPolicy || ""}
              onChange={(e) => onChange({
                paymentOptions: { ...formData.paymentOptions, refundPolicy: e.target.value }
              })}
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingCalendar06;