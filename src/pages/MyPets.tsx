 import { useState } from "react";
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
   Weight
 } from "lucide-react";
 
 interface ServiceHistory {
   id: string;
   type: "grooming" | "checkup";
   serviceName: string;
   date: Date;
   notes?: string;
 }
 
 interface Pet {
   id: string;
   name: string;
   species: string;
   breed: string;
   birthday: string; // ISO date string (YYYY-MM-DD)
   weight: number;
   photo: string;
   notes?: string;
   serviceHistory: ServiceHistory[];
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

   const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
     const file = e.target.files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
         const base64 = reader.result as string;
         if (isEdit && editingPet) {
           setEditingPet({ ...editingPet, photo: base64 });
         } else {
           setNewPetPhoto(base64);
         }
       };
       reader.readAsDataURL(file);
     }
   };
 
   // Sample pets data - in real app this would come from database
   const [pets, setPets] = useState<Pet[]>([
     {
       id: "1",
       name: "Buddy",
       species: "Dog",
       breed: "Golden Retriever",
       birthday: "2021-02-15",
       weight: 30,
       photo: "",
       notes: "Friendly and loves to play fetch. Allergic to chicken.",
       serviceHistory: [
         { id: "1", type: "grooming", serviceName: "Full Grooming Package", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), notes: "Coat trimmed, nails clipped" },
         { id: "2", type: "checkup", serviceName: "Annual Vaccination", date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), notes: "All vaccines up to date" },
         { id: "3", type: "grooming", serviceName: "Bath & Brush", date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
       ]
     },
     {
       id: "2",
       name: "Whiskers",
       species: "Cat",
       breed: "Persian",
       birthday: "2019-08-20",
       weight: 4.5,
       photo: "",
       notes: "Indoor cat, very calm. Prefers quiet environments.",
       serviceHistory: [
         { id: "4", type: "checkup", serviceName: "Dental Cleaning", date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), notes: "Teeth cleaned, no issues found" },
         { id: "5", type: "grooming", serviceName: "Fur Detangling", date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
       ]
     },
   ]);
 
   const getDaysAgo = (date: Date) => {
     const diffTime = Math.abs(new Date().getTime() - date.getTime());
     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
     if (diffDays === 0) return "Today";
     if (diffDays === 1) return "Yesterday";
     return `${diffDays} days ago`;
   };
 
   const handleAddPet = () => {
     // Validate required fields
     if (!newPet.name.trim() || !newPet.species || !newPet.breed.trim() || !newPet.birthday || !newPet.weight) {
       alert("Please fill in all required fields (Name, Species, Breed, Birthday, and Weight)");
       return;
     }

     // Add new pet to list
     const pet: Pet = {
       id: Date.now().toString(),
       name: newPet.name,
       species: newPet.species.charAt(0).toUpperCase() + newPet.species.slice(1),
       breed: newPet.breed,
       birthday: newPet.birthday,
       weight: parseFloat(newPet.weight) || 0,
       photo: newPetPhoto,
       notes: newPet.notes,
       serviceHistory: [],
     };
     setPets([...pets, pet]);
     setIsAddDialogOpen(false);
     setNewPet({ name: "", species: "", breed: "", birthday: "", weight: "", notes: "" });
     setNewPetPhoto("");
   };
 
   const handleEditPet = (pet: Pet) => {
     setEditingPet(pet);
   };
 
   const handleSaveEdit = () => {
     if (!editingPet) return;
     setPets(pets.map(p => p.id === editingPet.id ? editingPet : p));
     setEditingPet(null);
   };
 
   const handleDeletePet = (petId: string) => {
     setPets(pets.filter(p => p.id !== petId));
     setEditingPet(null);
   };
 
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
                         <AvatarImage src={editingPet.photo} className="object-cover" />
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
                         <AvatarImage src={pet.photo} />
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
                     {pet.serviceHistory.length === 0 ? (
                       <p className="text-sm text-muted-foreground py-4 text-center">
                         No service history yet
                       </p>
                     ) : (
                       <div className="space-y-3">
                         {pet.serviceHistory.map((service) => (
                           <div
                             key={service.id}
                             className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                           >
                             <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                               service.type === "grooming" 
                                 ? "bg-primary/10 text-primary" 
                                 : "bg-green-500/10 text-green-600"
                             }`}>
                               {service.type === "grooming" ? (
                                 <Scissors className="h-5 w-5" />
                               ) : (
                                 <Stethoscope className="h-5 w-5" />
                               )}
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
                         ))}
                       </div>
                     )}
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </div>
       </main>
       <Footer />
     </div>
   );
 };
 
 export default MyPets;