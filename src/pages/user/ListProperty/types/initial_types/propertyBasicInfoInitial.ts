export interface PropertyBasicInfoInitial {
  propertyName: string

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
  confirmPassword: string
  description: string
  isPinAccurate: boolean
  
  propertyImages: File[]
}