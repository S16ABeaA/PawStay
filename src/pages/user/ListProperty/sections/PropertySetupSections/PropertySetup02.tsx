import { PropertyTypeId } from "../../static/propertyTypeIDs";
import { AMENITY_OPTIONS } from "../../static/amenityOptions";

import { PropertyInitalData } from "../../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
  selectedTypes: PropertyTypeId[];
}

const PropertySetup02 = ({ formData, onChange, selectedTypes }: Props) => {
  const visibleAmenities = AMENITY_OPTIONS.filter(
    (amenity) => !amenity.types || amenity.types.some((type) => selectedTypes.includes(type)),
  );
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Facilities & Amenities
          </h2>
          <p className="text-muted-foreground">
            Describe your facilities and available amenities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleAmenities.map((amenity) => (
            <div
              key={amenity.name}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                formData.facilitiesAmenities.includes(amenity.name)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
              onClick={() => {
                const newAmenities = formData.facilitiesAmenities.includes(amenity.name)
                  ? formData.facilitiesAmenities.filter(a => a !== amenity.name)
                  : [...formData.facilitiesAmenities, amenity.name];
                onChange({ facilitiesAmenities: newAmenities });
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{amenity.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{amenity.name}</div>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={formData.facilitiesAmenities.includes(amenity.name)}
                  onChange={() => {}} // Handled by onClick
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PropertySetup02;