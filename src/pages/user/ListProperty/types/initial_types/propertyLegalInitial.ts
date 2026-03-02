export interface PropertyLegalInitial {
  lguPermits: File[]
  baiDocument: File | null
  contractDocument: File | null

  legalEntityType: '' | 'individual' | 'business'

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
}