import { CheckCircle2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { COUNTRY_CODES } from "../static/countryCodes";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
}

const ReviewComplete = ({ formData, onChange }: Props) => {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
          {/* Step Indicator */}
          <div className="text-center mb-8">
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-full"></div>
            </div>
          </div>

          {/* Individual vs Business Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
              Are you listing your pet services as an individual or a business?
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              This information is required for legal and tax purposes
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* Individual Card */}
              <div
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.legalEntityType === "individual"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onChange({ legalEntityType: "individual" })}
              >
                {formData.legalEntityType === "individual" && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="text-center">
                  <div className="text-4xl mb-4">👤</div>
                  <h3 className="text-lg font-semibold mb-2">Individual</h3>
                  <p className="text-sm text-muted-foreground">
                    You are registering as a sole proprietor or individual service provider
                  </p>
                </div>
              </div>

              {/* Business Card */}
              <div
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.legalEntityType === "business"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onChange({ legalEntityType: "business" })}
              >
                {formData.legalEntityType === "business" && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="text-center">
                  <div className="text-4xl mb-4">🏢</div>
                  <h3 className="text-lg font-semibold mb-2">Business</h3>
                  <p className="text-sm text-muted-foreground">
                    You are registering on behalf of a registered business entity
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contracting Party Information */}
          {formData.legalEntityType && (
            <div className="mb-8">
              <h4 className="text-lg font-medium text-foreground mb-4">
                Personal Information of the Contracting Party
              </h4>
              <p className="text-muted-foreground text-sm mb-6">
                Must match a valid government-issued ID
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.contractingParty.firstName || ""}
                    onChange={(e) => onChange({
                      contractingParty: { ...formData.contractingParty, firstName: e.target.value }
                    })}
                    placeholder="Enter your first name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">Middle Name(s)</Label>
                  <Input
                    id="middleName"
                    value={formData.contractingParty.middleName || ""}
                    onChange={(e) => onChange({
                      contractingParty: { ...formData.contractingParty, middleName: e.target.value }
                    })}
                    placeholder="Enter your middle name(s)"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.contractingParty.lastName || ""}
                    onChange={(e) => onChange({
                      contractingParty: { ...formData.contractingParty, lastName: e.target.value }
                    })}
                    placeholder="Enter your last name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contractingParty.email || ""}
                    onChange={(e) => onChange({
                      contractingParty: { ...formData.contractingParty, email: e.target.value }
                    })}
                    placeholder="Enter email address"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="flex mt-1">
                    <Select
                      value={formData.contractingParty.phoneCountryCode || "+63"}
                      onValueChange={(value) => onChange({
                        contractingParty: { ...formData.contractingParty, phoneCountryCode: value }
                      })}
                    >
                      <SelectTrigger className="w-32 rounded-r-none border-r-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((country) => (
                          <SelectItem key={country.code + country.country} value={country.code}>
                            {country.flag} {country.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      value={formData.contractingParty.phone || ""}
                      onChange={(e) => onChange({
                        contractingParty: { ...formData.contractingParty, phone: e.target.value }
                      })}
                      placeholder="9XX XXX XXXX"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Primary Address Section */}
          {formData.legalEntityType && (
            <div className="mb-8">
              <div className="border-t border-border pt-8 mb-6"></div>
              <h4 className="text-lg font-medium text-foreground mb-4">
                Primary Address of the Contracting Party
              </h4>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="country">Country / Region</Label>
                  <Select
                    value={formData.contractingPartyAddress.country || "Philippines"}
                    onValueChange={(value) => onChange({
                      contractingPartyAddress: { ...formData.contractingPartyAddress, country: value }
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    value={formData.contractingPartyAddress.streetAddress || ""}
                    onChange={(e) => onChange({
                      contractingPartyAddress: { ...formData.contractingPartyAddress, streetAddress: e.target.value }
                    })}
                    placeholder="Street address, building, apartment"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="addressLine2">Address Line 2 (optional)</Label>
                  <Input
                    id="addressLine2"
                    value={formData.contractingPartyAddress.addressLine2 || ""}
                    onChange={(e) => onChange({
                      contractingPartyAddress: { ...formData.contractingPartyAddress, addressLine2: e.target.value }
                    })}
                    placeholder="Additional address information"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.contractingPartyAddress.city || ""}
                    onChange={(e) => onChange({
                      contractingPartyAddress: { ...formData.contractingPartyAddress, city: e.target.value }
                    })}
                    placeholder="Enter city"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.contractingPartyAddress.postalCode || ""}
                    onChange={(e) => onChange({
                      contractingPartyAddress: { ...formData.contractingPartyAddress, postalCode: e.target.value }
                    })}
                    placeholder="Enter zip code"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Important Information Panel */}
          {formData.legalEntityType && (
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-blue-600 text-lg">ℹ️</div>
                  <div>
                    <h5 className="font-medium text-foreground mb-2">Important Information</h5>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-foreground text-sm">Can I control when I get bookings?</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Yes, you have full control over your availability and can accept or decline bookings based on your schedule.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-foreground text-sm">Are bookings confirmed instantly?</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Bookings are confirmed once you accept them. Pet owners can request bookings, but you have the final approval.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-foreground text-sm">Can I choose which pets I accept?</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Absolutely! You can set preferences for pet types, sizes, and special requirements that you're comfortable handling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Declaration & Agreement */}
          {formData.legalEntityType && (
            <div className="mb-8">
              <div className="bg-slate-50 rounded-xl p-6">
                <h4 className="text-lg font-medium text-foreground mb-4">
                  Declaration & Agreement
                </h4>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="termsAccepted"
                      checked={formData.legalAgreementAccepted.termsAccepted || false}
                      onCheckedChange={(checked) => onChange({
                        legalAgreementAccepted: { ...formData.legalAgreementAccepted, termsAccepted: checked as boolean }
                      })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="termsAccepted" className="text-sm font-medium cursor-pointer">
                        I agree to the{" "}
                        <a href="#" className="text-primary hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-primary hover:underline">
                          Privacy Policy
                        </a>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        By checking this box, you agree to be bound by our terms and conditions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="dataProcessing"
                      checked={formData.legalAgreementAccepted.dataProcessing || false}
                      onCheckedChange={(checked) => onChange({
                        legalAgreementAccepted: { ...formData.legalAgreementAccepted, dataProcessing: checked as boolean }
                      })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="dataProcessing" className="text-sm font-medium cursor-pointer">
                        I consent to the processing of my personal/business data
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        This includes data collection, storage, and processing for service provision and legal compliance.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="finalAgreement"
                      checked={formData.finalAgreementAccepted || false}
                      onCheckedChange={(checked) => onChange({
                        finalAgreementAccepted: checked as boolean
                      })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="finalAgreement" className="text-sm font-medium cursor-pointer">
                        I confirm that all information provided is accurate and complete
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        This declaration is required for legal compliance and service registration.
                      </p>
                    </div>
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

export default ReviewComplete;