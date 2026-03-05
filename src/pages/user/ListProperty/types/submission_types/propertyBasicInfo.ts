export interface PropertyBasicInfo {
  propertyName: string
  propertyType: 'hotel' | 'grooming' | 'veterinary'
  propertyTypes?: Array<'hotel' | 'grooming' | 'veterinary'>

  addressSearch: string
  addressLine2: string
  apartmentNum?: number
  country: string
  city: string
  zipCode: string
  latitude: number
  longitude: number

  phone: string
  ownerName: string
  email: string
  password: string
  description: string
  
  propertyImages: string[]
}