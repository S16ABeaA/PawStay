import { useMemo } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  type MapContainerProps,
  type MarkerProps,
  type TileLayerProps,
} from "react-leaflet";
import L from "leaflet";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

interface Props {
  formData: PropertyInitalData;
  onChange: (values: Partial<PropertyInitalData>) => void;
  updateAddress: (lat, lng, data, address) => void;
}

const EstablishmentInfo02 = ({ formData, onChange, updateAddress }: Props) => {
  
  const redPinIcon = useMemo(
    () =>
      L.icon({
        iconUrl:
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='46' viewBox='0 0 32 46'>
              <path d='M16 0C7.7 0 1 6.7 1 15c0 10.5 15 31 15 31s15-20.5 15-31C31 6.7 24.3 0 16 0z' fill='#e11d48'/>
              <circle cx='16' cy='15' r='6' fill='white'/>
            </svg>`,
          ),
        iconSize: [32, 46],
        iconAnchor: [16, 46],
      }),
    [],
  );

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams({
        format: "json",
        lat: String(lat),
        lon: String(lng),
        addressdetails: "1",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      if (!response.ok) return;
      const data = await response.json();
      const address = data?.address ?? {};
      updateAddress(lat, lng, data, address)
    } catch {
      onChange({
        latitude: lat,
        longitude: lng,
      });
    }
  };

  const MapClickHandler = ({
    enabled,
    onSelect,
  }: {
    enabled: boolean;
    onSelect: (lat: number, lng: number) => void;
  }) => {
    useMapEvents({
      click(e) {
        if (!enabled) return;
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const mapProps = {
    center: [formData.latitude, formData.longitude] as L.LatLngExpression,
    zoom: 16,
    scrollWheelZoom: true,
    className: "h-full w-full",
  } as unknown as MapContainerProps;

  const tileLayerProps = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  } as unknown as TileLayerProps;

  const markerProps = {
    position: [formData.latitude, formData.longitude] as L.LatLngExpression,
    icon: redPinIcon,
    draggable: true,
    eventHandlers: {
      dragend: (event: L.DragEndEvent) => {
        const marker = event.target as L.Marker;
        const { lat, lng } = marker.getLatLng();
        void reverseGeocode(lat, lng);
      },
    },
  } as unknown as MarkerProps;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Basic Info
        </h3>
        <p className="text-muted-foreground">
          Provide your address details for accurate listing placement
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border overflow-hidden h-[420px]">
            <MapContainer {...mapProps}>
              <TileLayer {...tileLayerProps} />
              <Marker {...markerProps} />
            <MapClickHandler
              enabled
              onSelect={(lat, lng) => void reverseGeocode(lat, lng)}
            />
          </MapContainer>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="addressSearch">
                Find Your Address
              </Label>
              <Input
                id="addressSearch"
                placeholder="De La Salle University Manila"
                value={formData.addressSearch}
                onChange={(e) => onChange({ addressSearch: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="addressLine2">
                Apartment or floor number (optional)
              </Label>
              <Input
                id="addressLine2"
                placeholder="Apartment, building, floor, etc"
                value={formData.addressLine2}
                onChange={(e) => onChange({ addressLine2: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country/region</Label>
              <Input
                id="country"
                placeholder="Philippines"
                value={formData.country}
                onChange={(e) => onChange({ country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Manila"
                value={formData.city}
                onChange={(e) => onChange({ city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip code</Label>
              <Input
                id="zipCode"
                placeholder="1004"
                value={formData.zipCode}
                onChange={(e) => onChange({ zipCode: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="pinAccurate"
                  checked={formData.isPinAccurate}
                  onCheckedChange={(checked) => onChange({ isPinAccurate: Boolean(checked) })}
                  className="mt-1"
                />
                <Label
                  htmlFor="pinAccurate"
                  className="text-sm cursor-pointer text-muted-foreground"
                >
                  Update the address by moving the pin on the map.
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EstablishmentInfo02;