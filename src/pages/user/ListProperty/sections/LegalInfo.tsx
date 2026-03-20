import { CheckCircle2, FileText, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
}

const LegalInfo = ({ formData, onChange }: Props) => {
  const handleFileChange = (
    field:
      | "baiDocument"
      | "contractDocument",
    file: File | null,
  ) => {
    onChange({ [field]: file });
  };

  const removeFile = (
    field:
      | "baiDocument"
      | "contractDocument",
  ) => {
    onChange({ [field]: null });
  };

  const handleLguPermitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPermits = Array.from(files);
      onChange({
        lguPermits: [...formData.lguPermits, ...newPermits].slice(0, 5), // Max 5 permits
      });
    }
  };

  const removeLguPermit = (index: number) => {
    onChange({
      lguPermits: formData.lguPermits.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Legal Information
        </h2>
        <p className="text-muted-foreground">
          Please upload your business license, BAI document, and signed contract
        </p>
      </div>

      {/* Upload Progress Indicator */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">
              Upload Progress
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {[
                formData.lguPermits.length > 0,
                formData.baiDocument,
                formData.contractDocument,
              ].filter(Boolean).length}{" "}
              of 3 required documents uploaded
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[
                formData.lguPermits.length > 0,
                formData.baiDocument,
                formData.contractDocument,
              ].map((file, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    file ? "bg-success" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* LGU Permits */}
        <div className="space-y-2">
          <Label
            htmlFor="lguPermits"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4 text-primary" />
            LGU Permit * (Max 5)
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Upload your Local Government Unit permits and clearances
          </p>
          
          {/* LGU Permits Grid */}
          <div className="grid grid-cols-2 gap-3">
            {formData.lguPermits.map((permit, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-xl"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {permit.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLguPermit(index)}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {/* Upload Button */}
            {formData.lguPermits.length < 5 && (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">
                  Add Permit
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {formData.lguPermits.length}/5
                </span>
                <input
                  type="file"
                  id="lguPermits"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={handleLguPermitUpload}
                />
              </label>
            )}
          </div>
          {formData.lguPermits.length > 0 && (
            <p className="text-xs text-success flex items-center gap-1 mt-2">
              <CheckCircle2 className="h-3 w-3" />
              {formData.lguPermits.length} {formData.lguPermits.length === 1 ? 'permit' : 'permits'} uploaded
            </p>
          )}
        </div>

        {/* BAI Document */}
        <div className="space-y-2">
          <Label
            htmlFor="baiDocument"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4 text-primary" />
            BAI Document *
          </Label>
          <div className="relative">
            {formData.baiDocument ? (
              <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">
                    {
                      formData
                        .baiDocument
                        .name
                    }
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    removeFile(
                      "baiDocument",
                    )
                  }
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">
                  Click to upload
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG up to 10MB
                </span>
                <input
                  type="file"
                  id="baiDocument"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) =>
                    handleFileChange(
                      "baiDocument",
                      e.target.files?.[0] ||
                        null,
                    )
                  }
                />
              </label>
            )}
          </div>
        </div>

        {/* Contract Document */}
        <div className="space-y-2">
          <Label
            htmlFor="contractDocument"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4 text-primary" />
            Signed Partner Contract *
          </Label>
          <div className="relative">
            {formData.contractDocument ? (
              <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">
                    {
                      formData.contractDocument
                        .name
                    }
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    removeFile(
                      "contractDocument",
                    )
                  }
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">
                  Click to upload
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PDF up to 10MB
                </span>
                <input
                  type="file"
                  id="contractDocument"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) =>
                    handleFileChange(
                      "contractDocument",
                      e.target.files?.[0] ||
                        null,
                    )
                  }
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Download the{" "}
            <a
              href="#"
              className="text-primary hover:underline"
            >
              Partner Agreement Template
            </a>{" "}
            to review and sign
          </p>
        </div>
      </div>
    </div>
  )
}

export default LegalInfo;