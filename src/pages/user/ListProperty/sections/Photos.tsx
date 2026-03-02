import { CheckCircle2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
}

const Photos = ({ formData, onChange }: Props) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      onChange({
        propertyImages: [...formData.propertyImages, ...newImages].slice(0, 10), // Max 10 images
      });
    }
  };

  const removeImage = (index: number) => {
    onChange({
      propertyImages: formData.propertyImages.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Property Photos
        </h2>
        <p className="text-muted-foreground">
          Upload at least 5 photos of your property. The more you upload, the more likely you are to get bookings. You can add more later.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {formData.propertyImages.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden bg-secondary/50 border-2 border-border group"
          >
            <img
              src={URL.createObjectURL(image)}
              alt={`Property ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {formData.propertyImages.length < 10 && (
          <label className="aspect-square flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-xs font-medium text-foreground text-center">
              Add Photo
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {formData.propertyImages.length}/10
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        )}
      </div>
      {formData.propertyImages.length > 0 && (
        <p className="text-xs text-success flex items-center gap-1 mt-2">
          <CheckCircle2 className="h-3 w-3" />
          {formData.propertyImages.length} {formData.propertyImages.length === 1 ? 'photo' : 'photos'} uploaded {formData.propertyImages.length >= 5 ? '(minimum met)' : `(${5 - formData.propertyImages.length} more needed)`}
        </p>
      )}
    </div>
  )
}

export default Photos;