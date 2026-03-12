export interface PropertyBookingInitial {
  checkInCutoff: string
  pickupStart: string
  pickupEnd: string
  appointmentOnly: string
  bookingRules: string[]
  
  cancellationPolicy: { 
    freeCancellation: string; 
    lateFee: string; 
    noShow: string 
  }

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
}