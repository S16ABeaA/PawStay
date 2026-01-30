import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MessageSquare, ThumbsUp, Flag } from "lucide-react";

const reviews = [
  {
    id: 1,
    author: "John Smith",
    pet: "Max",
    rating: 5,
    date: "2026-01-28",
    text: "Absolutely amazing service! Max had the best time and came back so happy. The staff was incredibly attentive and sent daily updates.",
    replied: true,
    service: "Boarding",
  },
  {
    id: 2,
    author: "Sarah Johnson",
    pet: "Bella",
    rating: 4,
    date: "2026-01-27",
    text: "Great grooming service. Bella looks beautiful! Only giving 4 stars because the wait was a bit long.",
    replied: false,
    service: "Grooming",
  },
  {
    id: 3,
    author: "Mike Brown",
    pet: "Charlie",
    rating: 5,
    date: "2026-01-25",
    text: "This is our go-to place for Charlie. The luxury suite is worth every penny. Love the webcam feature!",
    replied: true,
    service: "Boarding",
  },
  {
    id: 4,
    author: "Emily Davis",
    pet: "Luna",
    rating: 3,
    date: "2026-01-24",
    text: "Service was okay. Luna seemed a bit stressed when we picked her up. Would appreciate more communication.",
    replied: false,
    service: "Daycare",
  },
  {
    id: 5,
    author: "Alex Wilson",
    pet: "Cooper",
    rating: 5,
    date: "2026-01-22",
    text: "Outstanding care for Cooper! The team went above and beyond. Will definitely be back!",
    replied: true,
    service: "Boarding",
  },
];

const AdminReviews = () => {
  const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
  const pendingReplies = reviews.filter(r => !r.replied).length;

  return (
    <AdminLayout title="Reviews" subtitle="Monitor and respond to customer feedback">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-rating/10">
              <Star className="h-6 w-6 text-rating" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{averageRating}</p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <ThumbsUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingReplies}</p>
              <p className="text-sm text-muted-foreground">Pending Replies</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="pending">Needs Reply ({pendingReplies})</TabsTrigger>
          <TabsTrigger value="5star">5 Star</TabsTrigger>
          <TabsTrigger value="low">Low Ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">{review.author[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{review.author}</p>
                        <p className="text-xs text-muted-foreground">Pet: {review.pet} • {review.service}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-rating text-rating"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                      {review.replied && (
                        <Badge variant="outline" className="text-xs">Replied</Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>

                  <div className="flex gap-2">
                    {!review.replied && (
                      <Button size="sm" variant="outline" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Reply
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-muted-foreground">
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending">
          <p className="text-muted-foreground">Reviews awaiting your response...</p>
        </TabsContent>
        <TabsContent value="5star">
          <p className="text-muted-foreground">5-star reviews...</p>
        </TabsContent>
        <TabsContent value="low">
          <p className="text-muted-foreground">Reviews with low ratings...</p>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminReviews;
