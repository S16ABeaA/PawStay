import supabase from '@/config/supabaseClient'

export interface PropertySubmissionData {
  // Basic property info
  propertyName: string
  addressSearch: string
  addressLine2: string
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
  isPinAccurate: boolean

  // Services and types
  services: string[]
  petTypesAccepted: string[]
  dogSizes: string[]
  exoticPetTypes: string

  // Policies
  breedRestrictions: boolean
  breedRestrictionDetails: string
  aggressivePolicy: boolean
  aggressivePolicyDetails: string
  unvaccinatedPolicy: boolean
  unvaccinatedPolicyDetails: string
  facilitiesAmenities: string[]

  // Operating hours
  sameHoursEveryDay: boolean
  dailyOpenTime: string
  dailyCloseTime: string
  weeklyHours: Record<string, { open: string; close: string }>

  // Availability
  weekendAvailability: boolean
  holidayAvailability: boolean
  emergencyServices: boolean

  // Booking rules
  checkInCutoff: string
  pickupStart: string
  pickupEnd: string
  appointmentOnly: string
  bookingRules: string[]

  // Cancellation policy
  cancellationPolicy: { freeCancellation: string; lateFee: string; noShow: string }

  // Compliance and safety
  complianceRequirements: string[]
  healthSafety: string[]
  vetAvailability: string[]
  sanitationProtocols: string[]

  // Emergency contacts
  emergencyContact: string
  nearestVetHospital: string
  emergencyResponseTime: string

  // Pricing
  baseServices: Array<{ name: string; priceType: string; price: string; duration: string }>
  petSizePricing: { small: string; medium: string; large: string; giant: string; cats: string; exotic: string }
  addOns: Array<{ name: string; price: string; type: string }>
  vetFees: Record<string, string>

  // Boarding rules
  boardingRules: {
    advanceBooking: boolean
    sameDayBooking: boolean
    freeCancellation: boolean
    lateCancellationFee: boolean
    lateCancellationFeeAmount: string
    vaccinationRequired: boolean
    healthDeclaration: boolean
    noAggressivePets: boolean
    liabilityWaiver: boolean
  }

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
  paymentOptions: { deposit: boolean; methods: string[]; refundPolicy: string }

  // Pricing notes
  pricingNotes: string
  additionalPricingNotes: string

  // Legal information
  legalEntityType: 'individual' | 'business'
  contractingParty: {
    firstName: string
    middleName: string
    lastName: string
    email: string
    phone: string
    phoneCountryCode: string
  }
  contractingPartyAddress: {
    country: string
    streetAddress: string
    addressLine2: string
    city: string
    postalCode: string
  }
  legalAgreementAccepted: {
    termsAccepted: boolean
    dataProcessing: boolean
  }
  finalAgreementAccepted: boolean

  // Property type
  propertyType: 'hotel' | 'grooming' | 'veterinary'

  // File uploads (URLs after upload)
  propertyImages: string[]
  lguPermits: string[]
  baiDocument: string
  contractDocument: string

  // Additional fields
  occupancyRate: number
  animalCapacity: number
  apartmentNum?: number
}

export interface PropertySubmissionResponse {
  success: boolean
  applicationId?: number
  message?: string
  error?: string
}

export class PropertyService {
  private static readonly SUBMIT_PROPERTY_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/submit-property`

  static async submitProperty(data: PropertySubmissionData): Promise<PropertySubmissionResponse> {
    try {
      // Temporarily disabled for testing
      // const { data: session } = await supabase.auth.getSession()
      // if (!session.session?.access_token) {
      //   throw new Error('No authentication token found')
      // }

      const response = await fetch(this.SUBMIT_PROPERTY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Temporarily disabled for testing
          // 'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error) || 'Failed to submit property'
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Property submission error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  static async uploadFile(file: File, bucket: string, path: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('File upload error:', error)
        return null
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('File upload error:', error)
      return null
    }
  }

  static async uploadMultipleFiles(files: File[], bucket: string, basePath: string): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${index}.${fileExt}`
      const filePath = `${basePath}/${fileName}`

      return await this.uploadFile(file, bucket, filePath)
    })

    const results = await Promise.all(uploadPromises)
    return results.filter((url): url is string => url !== null)
  }
}