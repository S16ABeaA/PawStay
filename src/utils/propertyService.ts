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
  paymentOptions: { deposit: boolean; methods: string[]; refundPolicy: string; qrCodeGCash?: string; qrCodePayMaya?: string }

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
  propertyTypes?: Array<'hotel' | 'grooming' | 'veterinary'>

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
  private static readonly CONFIGURED_BACKEND_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_AUTH_API_URL ||
    'http://localhost:5001'

  private static readonly BACKEND_BASE_URLS = Array.from(
    new Set(
      [
        this.CONFIGURED_BACKEND_BASE_URL,
        'http://localhost:5001',
      ].filter((url): url is string => Boolean(url)),
    ),
  )

  private static readonly SUBMIT_PROPERTY_PATH = '/api/submit-property'

  static async submitProperty(data: PropertySubmissionData): Promise<PropertySubmissionResponse> {
    let attemptedUrls: string[] = []
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      const requestInit: RequestInit = {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(data),
      }

      let response: Response | null = null
      let lastNetworkError: unknown = null

      for (const baseUrl of this.BACKEND_BASE_URLS) {
        const requestUrl = `${baseUrl}${this.SUBMIT_PROPERTY_PATH}`
        attemptedUrls.push(requestUrl)
        try {
          response = await fetch(requestUrl, requestInit)
          break
        } catch (error) {
          lastNetworkError = error
        }
      }

      if (!response) {
        throw lastNetworkError instanceof Error
          ? lastNetworkError
          : new TypeError('Failed to fetch')
      }

      if (!response.ok) {
        let errorData: unknown = null
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        const parsedError =
          typeof errorData === 'object' &&
          errorData !== null &&
          'error' in errorData &&
          typeof (errorData as { error?: unknown }).error === 'string'
            ? (errorData as { error: string }).error
            : null

        const errorMessage = parsedError || `Failed to submit property (HTTP ${response.status})`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Property submission error:', error)

      const isNetworkError = error instanceof TypeError && error.message.includes('Failed to fetch')
      const networkErrorMessage =
        `Unable to reach property API. Checked: ${attemptedUrls.join(', ')}. ` +
        'Start backend server or set VITE_BACKEND_URL to your running backend URL.'

      return {
        success: false,
        error: isNetworkError ? networkErrorMessage : error instanceof Error ? error.message : 'Unknown error occurred',
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
        if (error.message?.includes('Bucket not found')) {
          console.error(`File upload error: Bucket "${bucket}" not found. Create this bucket in Supabase Storage and set proper policies.`)
        }
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