export interface PropertyPricingInitial {
  // Pricing
  baseServices: Array<{ 
    name: string; 
    priceType: string; 
    price: string;
    minPrice: string; 
    maxPrice: string;
    duration: string 
  }>
  petSizePricing: { small: string; medium: string; large: string; giant: string; cats: string; exotic: string }
  addOns: Array<{ name: string; price: string; type: string }>
  vetFees: Record<string, string>

  // Fees and charges
  feesCharges: {
    serviceFee: string
    taxes: string
    noShow: string
    latePickup: string
    cleaningFee: string
    emergencyFee: string
    holidaySurcharge: string
    cancellationFee: string
  }

  // Payment options
  paymentOptions: { 
    deposit: boolean; 
    methods: string[]; 
    refundPolicy: string; 
    qrCodeGCash: string; 
    qrCodePayMaya: string 
  }

  // Pricing notes
  pricingNotes: string
  additionalPricingNotes: string
}