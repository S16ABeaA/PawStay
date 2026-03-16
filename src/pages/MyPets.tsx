 import { useState, useEffect } from "react";
import { PetLoader } from "@/components/ui/PetLoader";
import RandomFullPagePetLoader from "@/components/ui/RandomFullPagePetLoader";
import { useBlockingPageLoad } from "@/hooks/useBlockingPageLoad";
 import { Link } from "react-router-dom";
 import Header from "@/components/Header";
 import Footer from "@/components/Footer";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Textarea } from "@/components/ui/textarea";
 import { 
   PawPrint, 
   Plus, 
   Camera, 
   Calendar, 
   Scissors, 
   Stethoscope,
   ChevronLeft,
   Edit,
   Cake,
  Weight,
  Hotel,
  Syringe,
  SmilePlus,
  CircleDot,
  CreditCard,
  FileText,
  MapPin,
  Clock,
} from "lucide-react";
import { petApi } from "@/services/petApi";
import { bookingApi } from "@/services/bookingApi";

interface ServiceHistory {
  id: string;
  bookingId?: string | null;
  type: "grooming" | "checkup" | "vaccination" | "dental" | "boarding" | "other";
  serviceName: string;
  date: string | Date;
  notes?: string;
}

interface Pet {
   id: string;
   name: string;
   species: string;
   breed: string;
   birthday: string; // ISO date string (YYYY-MM-DD)
   weight: number;
   photo_url: string | null;
   notes?: string | null;
   serviceHistory?: ServiceHistory[];
 }

 // Calculate age in years from birthday
 const calculateAge = (birthday: string): number => {
   const birthDate = new Date(birthday);
   const today = new Date();
   let age = today.getFullYear() - birthDate.getFullYear();
   const monthDiff = today.getMonth() - birthDate.getMonth();
   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
     age--;
   }
   return age;
 };
 
 // Helper: get icon and color for service type
 const getServiceTypeIcon = (type: string) => {
   switch (type) {
     case "boarding":
       return { icon: <Hotel className="h-5 w-5" />, className: "bg-blue-500/10 text-blue-600" };
     case "grooming":
       return { icon: <Scissors className="h-5 w-5" />, className: "bg-primary/10 text-primary" };
     case "checkup":
       return { icon: <Stethoscope className="h-5 w-5" />, className: "bg-green-500/10 text-green-600" };
     case "vaccination":
       return { icon: <Syringe className="h-5 w-5" />, className: "bg-purple-500/10 text-purple-600" };
     case "dental":
       return { icon: <SmilePlus className="h-5 w-5" />, className: "bg-amber-500/10 text-amber-600" };
     default:
       return { icon: <CircleDot className="h-5 w-5" />, className: "bg-gray-500/10 text-gray-600" };
   }
 };

 const MyPets = () => {
   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
   const [editingPet, setEditingPet] = useState<Pet | null>(null);
   const [newPetPhoto, setNewPetPhoto] = useState<string>("");
   const [newPet, setNewPet] = useState({
     name: "",
     species: "",
     breed: "",
     birthday: "",
     weight: "",
     notes: "",
   });
   const [loading, setLoading] = useState(true);
   const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
   const [selectedService, setSelectedService] = useState<ServiceHistory | null>(null);
   const [allHistoryOpen, setAllHistoryOpen] = useState(false);
   const [selectedPetForHistory, setSelectedPetForHistory] = useState<Pet | null>(null);
   const [bookingDetail, setBookingDetail] = useState<any>(null);
   const [bookingLoading, setBookingLoading] = useState(false);
   const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPageBlocking, notifyLoaderFinished] = useBlockingPageLoad(loading, 800);

   const handleServiceClick = async (service: ServiceHistory) => {
     setSelectedService(service);
     setBookingDetail(null);
     setServiceDetailOpen(true);

     if (service.bookingId) {
       setBookingLoading(true);
       try {
         const res = await bookingApi.getById(service.bookingId);
         setBookingDetail(res.booking);
       } catch (err) {
         console.error("Failed to fetch booking details:", err);
       } finally {
         setBookingLoading(false);
       }
     }
   };

  const handleViewAllHistory = (pet: Pet) => {
    setSelectedPetForHistory(pet);
    setAllHistoryOpen(true);
  };

   const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
     const file = e.target.files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
         const base64 = reader.result as string;
         if (isEdit && editingPet) {
           setEditingPet({ ...editingPet, photo_url: base64 });
         } else {
           setNewPetPhoto(base64);
         }
       };
       reader.readAsDataURL(file);
     }
   };
 
   // Pets state — loaded from backend
   const [pets, setPets] = useState<Pet[]>([]);

   // Fetch pets from backend on mount
   useEffect(() => {
     const fetchPets = async () => {
       try {
         setLoading(true);
         const data = await petApi.list();
         // Map DB rows to local shape (add empty serviceHistory)
         const mapped = (data.pets ?? []).map((p: any) => ({
           ...p,
           serviceHistory: p.serviceHistory ?? [],
         }));
         setPets(mapped);
       } catch (err) {
         console.error("Failed to load pets:", err);
       } finally {
         setLoading(false);
       }
     };
     fetchPets();
   }, []);
 
   const getDaysAgo = (date: string | Date) => {
     const d = typeof date === "string" ? new Date(date) : date;
     const diffTime = Math.abs(new Date().getTime() - d.getTime());
     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
     if (diffDays === 0) return "Today";
     if (diffDays === 1) return "Yesterday";
     return `${diffDays} days ago`;
   };
 
   const handleAddPet = async () => {
     // Validate required fields
     if (!newPet.name.trim() || !newPet.species || !newPet.breed.trim() || !newPet.birthday || !newPet.weight) {
       alert("Please fill in all required fields (Name, Species, Breed, Birthday, and Weight)");
       return;
     }

     try {
       const data = await petApi.create({
         name: newPet.name,
         species: newPet.species.charAt(0).toUpperCase() + newPet.species.slice(1),
         breed: newPet.breed,
         birthday: newPet.birthday,
         weight: parseFloat(newPet.weight) || 0,
         photo_url: newPetPhoto || null,
         notes: newPet.notes || null,
       });

       const created: Pet = { ...data.pet, serviceHistory: [] };
       setPets([created, ...pets]);
       setIsAddDialogOpen(false);
       setNewPet({ name: "", species: "", breed: "", birthday: "", weight: "", notes: "" });
       setNewPetPhoto("");
     } catch (err) {
       console.error("Failed to add pet:", err);
       alert("Failed to add pet. Please try again.");
     }
   };
 
   const handleEditPet = (pet: Pet) => {
     setEditingPet(pet);
   };
 
   const handleSaveEdit = async () => {
     if (!editingPet) return;
     try {
       const data = await petApi.update(editingPet.id, {
         name: editingPet.name,
         species: editingPet.species,
         breed: editingPet.breed,
         birthday: editingPet.birthday,
         weight: editingPet.weight,
         photo_url: editingPet.photo_url,
         notes: editingPet.notes,
       });
       const updated: Pet = { ...data.pet, serviceHistory: editingPet.serviceHistory ?? [] };
       setPets(pets.map(p => p.id === updated.id ? updated : p));
       setEditingPet(null);
     } catch (err) {
       console.error("Failed to update pet:", err);
       alert("Failed to save changes. Please try again.");
     }
   };
 
   const handleDeletePet = async (petId: string) => {
     try {
       await petApi.delete(petId);
       setPets(pets.filter(p => p.id !== petId));
       setEditingPet(null);
     } catch (err) {
       console.error("Failed to delete pet:", err);
       alert("Failed to delete pet. Please try again.");
     }
   };
 
  if (isPageBlocking) {
    return <RandomFullPagePetLoader dataLoaded={!loading} onComplete={notifyLoaderFinished} />;
  }

   return (
     <div className="min-h-screen bg-background">
       <Header />
       <main className="py-8 md:py-12">
         <div className="container max-w-4xl">
           {/* Header */}
           <div className="flex items-center gap-4 mb-8">
             <Link to="/profile">
               <Button variant="ghost" size="icon">
                 <ChevronLeft className="h-5 w-5" />
               </Button>
             </Link>
             <div className="flex-1">
               <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                 My Pets
               </h1>
               <p className="text-muted-foreground">Manage your pet profiles and view their service history</p>
             </div>
             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
               <DialogTrigger asChild>
                 <Button variant="hero">
                   <Plus className="h-4 w-4 mr-2" />
                   Add Pet
                 </Button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                   <DialogTitle>Add New Pet</DialogTitle>
                   <DialogDescription>
                     Enter your pet's information to create their profile.
                   </DialogDescription>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                   <div className="flex justify-center">
                     <div className="relative">
                       <Avatar className="h-24 w-24 border-4 border-dashed border-muted-foreground/30 overflow-hidden">
                         {newPetPhoto ? (
                           <AvatarImage src={newPetPhoto} className="object-cover" />
                         ) : (
                           <AvatarFallback className="bg-muted">
                             <PawPrint className="h-10 w-10 text-muted-foreground" />
                           </AvatarFallback>
                         )}
                       </Avatar>
                       <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft cursor-pointer hover:bg-primary/90 transition-colors">
                         <Camera className="h-4 w-4" />
                         <input
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={(e) => handlePhotoUpload(e, false)}
                         />
                       </label>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="petName">Pet Name <span className="text-red-500">*</span></Label>
                     <Input
                       id="petName"
                       placeholder="e.g., Buddy"
                       value={newPet.name}
                       onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                       required
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="species">Species <span className="text-red-500">*</span></Label>
                       <Select value={newPet.species} onValueChange={(v) => setNewPet({ ...newPet, species: v })}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="dog">Dog</SelectItem>
                           <SelectItem value="cat">Cat</SelectItem>
                           <SelectItem value="bird">Bird</SelectItem>
                           <SelectItem value="rabbit">Rabbit</SelectItem>
                           <SelectItem value="other">Other</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="breed">Breed <span className="text-red-500">*</span></Label>
                       <Input
                         id="breed"
                         placeholder="e.g., Golden Retriever"
                         value={newPet.breed}
                         onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="birthday">Birthday <span className="text-red-500">*</span></Label>
                     <Input
                       id="birthday"
                       type="date"
                       value={newPet.birthday}
                       onChange={(e) => setNewPet({ ...newPet, birthday: e.target.value })}
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="weight">Weight (kg) <span className="text-red-500">*</span></Label>
                     <Input
                       id="weight"
                       type="number"
                       placeholder="e.g., 15"
                       value={newPet.weight}
                       onChange={(e) => setNewPet({ ...newPet, weight: e.target.value })}
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="notes">Notes (optional)</Label>
                     <Textarea
                       id="notes"
                       placeholder="Allergies, special needs, personality..."
                       value={newPet.notes}
                       onChange={(e) => setNewPet({ ...newPet, notes: e.target.value })}
                     />
                   </div>
                 </div>
                 <div className="flex gap-2 justify-end">
                   <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                     Cancel
                   </Button>
                   <Button variant="hero" onClick={handleAddPet}>
                     Add Pet
                   </Button>
                 </div>
               </DialogContent>
             </Dialog>

           {/* Edit Pet Dialog */}
           <Dialog open={!!editingPet} onOpenChange={(open) => !open && setEditingPet(null)}>
             <DialogContent className="sm:max-w-md">
               <DialogHeader>
                 <DialogTitle>Edit Pet Profile</DialogTitle>
                 <DialogDescription>
                   Update {editingPet?.name}'s information.
                 </DialogDescription>
               </DialogHeader>
               {editingPet && (
                 <div className="space-y-4 py-4">
                   <div className="flex justify-center">
                     <div className="relative">
                       <Avatar className="h-24 w-24 border-4 border-background shadow-elevated">
                         <AvatarImage src={editingPet.photo_url || undefined} className="object-cover" />
                         <AvatarFallback className="bg-gradient-hero text-2xl text-white">
                           {editingPet.name[0]}
                         </AvatarFallback>
                       </Avatar>
                       <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft cursor-pointer hover:bg-primary/90 transition-colors">
                         <Camera className="h-4 w-4" />
                         <input
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={(e) => handlePhotoUpload(e, true)}
                         />
                       </label>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="editPetName">Pet Name <span className="text-red-500">*</span></Label>
                     <Input
                       id="editPetName"
                       value={editingPet.name}
                       onChange={(e) => setEditingPet({ ...editingPet, name: e.target.value })}
                       required
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="editSpecies">Species <span className="text-red-500">*</span></Label>
                       <Select 
                         value={editingPet.species.toLowerCase()} 
                         onValueChange={(v) => setEditingPet({ ...editingPet, species: v.charAt(0).toUpperCase() + v.slice(1) })}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="dog">Dog</SelectItem>
                           <SelectItem value="cat">Cat</SelectItem>
                           <SelectItem value="bird">Bird</SelectItem>
                           <SelectItem value="rabbit">Rabbit</SelectItem>
                           <SelectItem value="other">Other</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="editBreed">Breed <span className="text-red-500">*</span></Label>
                       <Input
                         id="editBreed"
                         value={editingPet.breed}
                         onChange={(e) => setEditingPet({ ...editingPet, breed: e.target.value })}
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="editBirthday">Birthday <span className="text-red-500">*</span></Label>
                     <Input
                       id="editBirthday"
                       type="date"
                       value={editingPet.birthday}
                       onChange={(e) => setEditingPet({ ...editingPet, birthday: e.target.value })}
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="editWeight">Weight (kg) <span className="text-red-500">*</span></Label>
                     <Input
                       id="editWeight"
                       type="number"
                       value={editingPet.weight}
                       onChange={(e) => setEditingPet({ ...editingPet, weight: parseFloat(e.target.value) || 0 })}
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="editNotes">Notes (optional)</Label>
                     <Textarea
                       id="editNotes"
                       placeholder="Allergies, special needs, personality..."
                       value={editingPet.notes || ""}
                       onChange={(e) => setEditingPet({ ...editingPet, notes: e.target.value })}
                     />
                   </div>
                 </div>
               )}
               <div className="flex gap-2 justify-between">
                 <Button 
                   variant="destructive" 
                   onClick={() => editingPet && handleDeletePet(editingPet.id)}
                 >
                   Delete Pet
                 </Button>
                 <div className="flex gap-2">
                   <Button variant="outline" onClick={() => setEditingPet(null)}>
                     Cancel
                   </Button>
                   <Button variant="hero" onClick={handleSaveEdit}>
                     Save Changes
                   </Button>
                 </div>
               </div>
             </DialogContent>
           </Dialog>
           </div>
 
           {/* Pets List */}
           {pets.length === 0 ? (
             <Card>
               <CardContent className="py-12">
                 <div className="flex flex-col items-center justify-center text-center">
                   <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                     <PawPrint className="h-10 w-10 text-muted-foreground" />
                   </div>
                   <h3 className="text-lg font-semibold mb-2">No pets yet</h3>
                   <p className="text-muted-foreground mb-6 max-w-sm">
                     Add your first pet to keep track of their grooming and veterinary visits.
                   </p>
                   <Button variant="hero" onClick={() => setIsAddDialogOpen(true)}>
                     <Plus className="h-4 w-4 mr-2" />
                     Add Your First Pet
                   </Button>
                 </div>
               </CardContent>
             </Card>
           ) : (
             <div className="space-y-6">
               {pets.map((pet) => (
                 <Card key={pet.id} className="overflow-hidden">
                   <CardHeader className="pb-4">
                     <div className="flex items-start gap-4">
                       <Avatar className="h-20 w-20 border-4 border-background shadow-elevated">
                         <AvatarImage src={pet.photo_url || undefined} />
                         <AvatarFallback className="bg-gradient-hero text-2xl text-white">
                           {pet.name[0]}
                         </AvatarFallback>
                       </Avatar>
                       <div className="flex-1">
                         <div className="flex items-center justify-between">
                           <div>
                             <CardTitle className="text-xl flex items-center gap-2">
                               {pet.name}
                               <Badge variant="secondary">{pet.species}</Badge>
                             </CardTitle>
                             <CardDescription className="mt-1">{pet.breed}</CardDescription>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => handleEditPet(pet)}>
                             <Edit className="h-4 w-4" />
                           </Button>
                         </div>
                         <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                           <div className="flex items-center gap-1">
                             <Calendar className="h-4 w-4" />
                             <span>DOB: {new Date(pet.birthday).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center gap-1">
                             <Cake className="h-4 w-4" />
                             <span>{calculateAge(pet.birthday)} {calculateAge(pet.birthday) === 1 ? "year" : "years"} old</span>
                           </div>
                           <div className="flex items-center gap-1">
                             <Weight className="h-4 w-4" />
                             <span>{pet.weight} kg</span>
                           </div>
                         </div>
                       </div>
                     </div>
                     {pet.notes && (
                       <p className="text-sm text-muted-foreground mt-4 bg-muted/50 p-3 rounded-lg">
                         {pet.notes}
                       </p>
                     )}
                   </CardHeader>
                   <CardContent>
                     <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-primary" />
                       Recent Services
                     </h4>
                     {(!pet.serviceHistory || pet.serviceHistory.length === 0) ? (
                       <p className="text-sm text-muted-foreground py-4 text-center">
                         No service history yet
                       </p>
                     ) : (
                       <div className="space-y-3">
                         {(pet.serviceHistory ?? []).slice(0, 3).map((service) => {
                           const { icon, className: iconClass } = getServiceTypeIcon(service.type);
                           return (
                             <div
                               key={service.id}
                               className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                               onClick={() => handleServiceClick(service)}
                             >
                               <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconClass}`}>
                                 {icon}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium truncate">{service.serviceName}</p>
                                 {service.notes && (
                                   <p className="text-xs text-muted-foreground truncate">{service.notes}</p>
                                 )}
                               </div>
                               <Badge variant="outline" className="shrink-0">
                                 {getDaysAgo(service.date)}
                               </Badge>
                             </div>
                           );
                         })}

                         {(pet.serviceHistory?.length ?? 0) > 3 && (
                           <div className="pt-1 flex justify-center">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleViewAllHistory(pet)}
                             >
                               View All ({pet.serviceHistory?.length})
                             </Button>
                           </div>
                         )}
                       </div>
                     )}
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </div>

         {/* All Service History Dialog */}
         <Dialog open={allHistoryOpen} onOpenChange={setAllHistoryOpen}>
           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>
                 {selectedPetForHistory ? `${selectedPetForHistory.name}'s Service History` : "Service History"}
               </DialogTitle>
               <DialogDescription>
                 Showing all recorded services. Click an item to view full details.
               </DialogDescription>
             </DialogHeader>

             {!selectedPetForHistory || !selectedPetForHistory.serviceHistory || selectedPetForHistory.serviceHistory.length === 0 ? (
               <p className="text-sm text-muted-foreground py-6 text-center">No service history yet</p>
             ) : (
               <div className="space-y-3">
                 {(selectedPetForHistory.serviceHistory ?? []).map((service) => {
                   const { icon, className: iconClass } = getServiceTypeIcon(service.type);
                   return (
                     <div
                       key={service.id}
                       className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                       onClick={() => {
                         setAllHistoryOpen(false);
                         handleServiceClick(service);
                       }}
                     >
                       <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconClass}`}>
                         {icon}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium truncate">{service.serviceName}</p>
                         {service.notes && (
                           <p className="text-xs text-muted-foreground truncate">{service.notes}</p>
                         )}
                       </div>
                       <Badge variant="outline" className="shrink-0">
                         {getDaysAgo(service.date)}
                       </Badge>
                     </div>
                   );
                 })}
               </div>
             )}

             <div className="flex justify-center pt-2">
               <Button variant="outline" onClick={() => setAllHistoryOpen(false)}>Close</Button>
             </div>
           </DialogContent>
         </Dialog>

         {/* Service Detail Dialog */}
         <Dialog open={serviceDetailOpen} onOpenChange={setServiceDetailOpen}>
           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                 {selectedService && (() => {
                   const { icon, className: iconClass } = getServiceTypeIcon(selectedService.type);
                   return <div className={`h-8 w-8 rounded-full flex items-center justify-center ${iconClass}`}>{icon}</div>;
                 })()}
                 Service Details
               </DialogTitle>
               <DialogDescription>
                 {selectedService?.serviceName}
               </DialogDescription>
             </DialogHeader>
             {selectedService && (
               <div className="space-y-6">
                 {/* Service Info */}
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm text-muted-foreground">Service Name</p>
                     <p className="font-medium">{selectedService.serviceName}</p>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Type</p>
                     <Badge className="capitalize mt-1">{selectedService.type}</Badge>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Date</p>
                     <p className="font-medium flex items-center gap-1">
                       <Calendar className="h-4 w-4" />
                       {new Date(selectedService.date).toLocaleDateString()}
                     </p>
                   </div>
                   {selectedService.notes && (
                     <div className="col-span-2">
                       <p className="text-sm text-muted-foreground">Notes</p>
                       <p className="font-medium text-sm bg-muted/50 p-3 rounded-lg mt-1">{selectedService.notes}</p>
                     </div>
                   )}
                 </div>

                 {/* Booking Details (if linked to a booking) */}
                 {selectedService.bookingId && (
                   <div className="border-t pt-4">
                     {bookingLoading ? (
                       <PetLoader text="Loading booking details..." className="py-8" />
                     ) : bookingDetail ? (
                       <div className="space-y-4">
                         <h4 className="font-semibold text-sm flex items-center gap-2">
                           <FileText className="h-4 w-4 text-primary" />
                           Booking Information
                         </h4>
                         <div className="grid grid-cols-2 gap-4">
                           {bookingDetail.property_name && (
                             <div>
                               <p className="text-sm text-muted-foreground">Property</p>
                               <p className="font-medium flex items-center gap-1">
                                 <MapPin className="h-3.5 w-3.5" />
                                 {bookingDetail.property_name}
                               </p>
                             </div>
                           )}
                           {bookingDetail.pet_name && (
                             <div>
                               <p className="text-sm text-muted-foreground">Pet</p>
                               <p className="font-medium">{bookingDetail.pet_name}</p>
                             </div>
                           )}
                           {bookingDetail.service_name && (
                             <div>
                               <p className="text-sm text-muted-foreground">Service</p>
                               <p className="font-medium">{bookingDetail.service_name}</p>
                             </div>
                           )}
                           {bookingDetail.room_name && (
                             <div>
                               <p className="text-sm text-muted-foreground">Room</p>
                               <p className="font-medium">{bookingDetail.room_name}</p>
                             </div>
                           )}
                           <div>
                             <p className="text-sm text-muted-foreground">Check-in</p>
                             <p className="font-medium flex items-center gap-1">
                               <Calendar className="h-3.5 w-3.5" />
                               {new Date(bookingDetail.checkin).toLocaleDateString()}
                               {bookingDetail.time_slot && (
                                 <span className="text-muted-foreground ml-1 flex items-center gap-0.5">
                                   <Clock className="h-3 w-3" /> {bookingDetail.time_slot}
                                 </span>
                               )}
                             </p>
                           </div>
                           {bookingDetail.checkout && (
                             <div>
                               <p className="text-sm text-muted-foreground">Check-out</p>
                               <p className="font-medium flex items-center gap-1">
                                 <Calendar className="h-3.5 w-3.5" />
                                 {new Date(bookingDetail.checkout).toLocaleDateString()}
                               </p>
                             </div>
                           )}
                           {bookingDetail.total_price != null && (
                             <div>
                               <p className="text-sm text-muted-foreground">Amount</p>
                               <p className="font-medium">₱{Number(bookingDetail.total_price).toLocaleString()}</p>
                             </div>
                           )}
                           <div>
                             <p className="text-sm text-muted-foreground">Status</p>
                             <Badge variant={bookingDetail.status === "confirmed" ? "default" : bookingDetail.status === "pending" ? "secondary" : bookingDetail.status === "completed" ? "default" : "destructive"} className="mt-1">
                               {bookingDetail.status}
                             </Badge>
                           </div>
                           {bookingDetail.special_requirements && (
                             <div className="col-span-2">
                               <p className="text-sm text-muted-foreground">Special Requirements</p>
                               <p className="text-sm bg-muted/50 p-3 rounded-lg mt-1">{bookingDetail.special_requirements}</p>
                             </div>
                           )}
                         </div>

                         {/* Payment Details */}
                         {bookingDetail.payment_method && (
                           <div className="border-t pt-4">
                             <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                               <CreditCard className="h-4 w-4 text-primary" />
                               Payment Information
                             </h4>
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <p className="text-sm text-muted-foreground">Payment Method</p>
                                 <p className="font-medium capitalize">{bookingDetail.payment_method}</p>
                               </div>
                               {bookingDetail.reference_number && (
                                 <div>
                                   <p className="text-sm text-muted-foreground">Reference Number</p>
                                   <p className="font-medium font-mono text-sm bg-muted/50 px-2 py-1 rounded inline-block">{bookingDetail.reference_number}</p>
                                 </div>
                               )}
                               <div>
                                 <p className="text-sm text-muted-foreground">Payment Status</p>
                                 <Badge variant={bookingDetail.payment_status === "paid" ? "default" : "secondary"} className="mt-1 capitalize">
                                   {bookingDetail.payment_status}
                                 </Badge>
                               </div>
                             </div>
                             {bookingDetail.payment_screenshot_url && (
                               <div className="mt-3">
                                 <p className="text-sm text-muted-foreground mb-2">Payment Screenshot</p>
                                 <div
                                   className="cursor-pointer inline-block border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                                   onClick={() => setImagePreview(bookingDetail.payment_screenshot_url)}
                                 >
                                   <img
                                     src={bookingDetail.payment_screenshot_url}
                                     alt="Payment proof"
                                     className="w-40 h-40 object-cover"
                                   />
                                 </div>
                                 <p className="text-xs text-muted-foreground mt-1">Click to enlarge</p>
                               </div>
                             )}
                           </div>
                         )}

                         {/* Pet Documents */}
                         {(bookingDetail.vaccine_record_url || bookingDetail.med_cert_url) && (
                           <div className="border-t pt-4">
                             <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                               <FileText className="h-4 w-4 text-primary" />
                               Pet Documents
                             </h4>
                             <div className="flex flex-wrap gap-4">
                               {bookingDetail.vaccine_record_url && (
                                 <div>
                                   <p className="text-sm text-muted-foreground mb-2">Vaccine Record</p>
                                   <div
                                     className="cursor-pointer inline-block border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                                     onClick={() => setImagePreview(bookingDetail.vaccine_record_url)}
                                   >
                                     <img
                                       src={bookingDetail.vaccine_record_url}
                                       alt="Vaccine record"
                                       className="w-40 h-40 object-cover"
                                     />
                                   </div>
                                   <p className="text-xs text-muted-foreground mt-1">Click to enlarge</p>
                                 </div>
                               )}
                               {bookingDetail.med_cert_url && (
                                 <div>
                                   <p className="text-sm text-muted-foreground mb-2">Medical Certificate</p>
                                   <div
                                     className="cursor-pointer inline-block border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                                     onClick={() => setImagePreview(bookingDetail.med_cert_url)}
                                   >
                                     <img
                                       src={bookingDetail.med_cert_url}
                                       alt="Medical certificate"
                                       className="w-40 h-40 object-cover"
                                     />
                                   </div>
                                   <p className="text-xs text-muted-foreground mt-1">Click to enlarge</p>
                                 </div>
                               )}
                             </div>
                           </div>
                         )}
                       </div>
                     ) : (
                       <p className="text-sm text-muted-foreground text-center py-4">
                         Could not load booking details.
                       </p>
                     )}
                   </div>
                 )}

                 <div className="flex justify-end pt-4 border-t">
                   <Button variant="outline" onClick={() => setServiceDetailOpen(false)}>Close</Button>
                 </div>
               </div>
             )}
           </DialogContent>
         </Dialog>

         {/* Image Preview Dialog */}
         <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
           <DialogContent className="max-w-3xl p-2">
             <DialogHeader>
               <DialogTitle>Image Preview</DialogTitle>
               <DialogDescription>Click outside or press Escape to close</DialogDescription>
             </DialogHeader>
             {imagePreview && (
               <div className="flex items-center justify-center">
                 <img src={imagePreview} alt="Preview" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
               </div>
             )}
           </DialogContent>
         </Dialog>

       </main>
       <Footer />
     </div>
   );
 };
 
 export default MyPets;