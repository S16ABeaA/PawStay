export interface PropertyCapacity {
  occupancyRate: number
  animalCapacity: number
  serviceCapacities: Array<{ name: string; capacity: number }>
}