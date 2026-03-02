export interface PropertyCapacityInitial {
  occupancyRate: number
  animalCapacity: number
  serviceCapacities: Array<{ name: string; capacity: number }>
}