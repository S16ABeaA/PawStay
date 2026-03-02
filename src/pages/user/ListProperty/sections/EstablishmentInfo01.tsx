import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PropertyTypeCard from "../components/listPropertyTypeCard";

import { PropertyTypeId } from "../static/propertyTypeIDs";
import { PROPERTY_TYPES } from "../static/propertyTypes";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
  selectedTypes: PropertyTypeId[];
  updateSelectedTypes: (type) => void;
}

const EstablishmentInfo01 = ({ formData, onChange, selectedTypes, updateSelectedTypes }: Props) => {
  return (
    <div className="space-y-6">
      <div className="md:col-span-3 space-y-2">
        <Label htmlFor="propertyName" className="text-base font-semibold text-foreground">
          Property Name *
        </Label>
        <Input
          id="propertyName"
          placeholder="e.g., Happy Tails Pet Hotel"
          value={formData.propertyName}
          onChange={(e) => onChange({ propertyName: e.target.value })}
          className="h-12 text-base"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Property Type
        </h3>
        <p className="text-muted-foreground">
          Select all that apply to your business
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {PROPERTY_TYPES.map((type) => (
          <PropertyTypeCard
            key={type.id}
            icon={type.icon}
            title={type.title}
            description={type.description}
            isSelected={
              selectedTypes.includes(type.id)
            }
            onClick={() => updateSelectedTypes(type)}
          />
        ))}
      </div>
    </div>
  )
}

export default EstablishmentInfo01;