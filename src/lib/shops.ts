export interface Shop {
  id: number;
  type: "veterinary" | "grooming";
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  priceFrom?: number;
  availability?: string;
  amenities?: string[];
}

export const veterinaryShops: Shop[] = [
  {
    id: 1001,
    type: "veterinary",
    name: "PawCare Veterinary Clinic",
    image:
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&auto=format&fit=crop",
    location: "San Francisco, CA",
    rating: 4.9,
    reviews: 482,
    priceFrom: 75,
    availability: "Open today",
    amenities: ["Vaccinations", "Surgery", "On-site Lab"],
  },
  {
    id: 1002,
    type: "veterinary",
    name: "Bay Area Animal Hospital",
    image:
      "https://images.unsplash.com/photo-1507149833265-60c372daea22?w=800&auto=format&fit=crop",
    location: "Oakland, CA",
    rating: 4.8,
    reviews: 321,
    priceFrom: 65,
    availability: "Open 8AM - 6PM",
    amenities: ["Emergency Care", "Dentistry"],
  },
];

export const groomingShops: Shop[] = [
  {
    id: 2001,
    type: "grooming",
    name: "Bubbles & Tails Salon",
    image:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&auto=format&fit=crop",
    location: "San Francisco, CA",
    rating: 4.9,
    reviews: 1287,
    priceFrom: 45,
    availability: "Slots available",
    amenities: ["Bath & Dry", "Haircut", "Nail Trim"],
  },
  {
    id: 2002,
    type: "grooming",
    name: "Purr & Pooch Spa",
    image:
      "https://images.unsplash.com/photo-1507149833265-60c372daea22?w=800&auto=format&fit=crop",
    location: "Berkeley, CA",
    rating: 4.7,
    reviews: 654,
    priceFrom: 55,
    availability: "Open 9AM - 5PM",
    amenities: ["Specialty Shampoos", "De-matting"],
  },
];

export const allShops = [...veterinaryShops, ...groomingShops];
