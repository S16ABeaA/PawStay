import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, MessageSquare, ThumbsUp, Flag, Send, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { reviewsApi, OwnerReview } from "@/services/reviewsApi";
import { useAdminProperty } from "@/hooks/useAdminProperty";

const AdminReviews = () => {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<OwnerReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const { toast } = useToast();
  const { selectedPropertyId, loading: propLoading } = useAdminProperty();

  const averageRating = reviews.length ? (reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : "0.0";
  const pendingReplies = reviews.filter((r) => !r.replied).length;

  // Fetch reviews from backend for selected property
  useEffect(() => {
    let cancelled = false;

    // Clear stale reviews when property changes
    setReviews([]);

    if (propLoading) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await reviewsApi.myReviews(selectedPropertyId);
        if (cancelled) return;
        setReviews(data.reviews ?? []);
      } catch (err) {
        console.error('Failed to load reviews', err);
        if (!cancelled) toast({ title: "Error", description: "Failed to load reviews.", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReviews();

    return () => { cancelled = true; };
  }, [selectedPropertyId, propLoading]);

  const handleReply = (review: OwnerReview) => {
    setSelectedReview(review);
    setReplyText("");
    setReplyDialogOpen(true);
  };

  const submitReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setReplying(true);
    try {
      await reviewsApi.replyToReview(selectedReview.id, replyText);
      setReviews((prev) => prev.map((r) => (r.id === selectedReview.id ? { ...r, replied: true, reply: replyText } : r)));
      toast({ title: 'Reply Sent', description: 'Your reply has been posted.' });
      setReplyDialogOpen(false);
    } catch (err: any) {
      console.error('Reply failed', err);
      toast({ title: 'Error', description: err?.message || 'Failed to send reply', variant: 'destructive' });
    } finally {
      setReplying(false);
    }
  };

  const handleFlag = (id: string) => {
    toast({ title: "Review Flagged", description: "This review has been flagged for moderation." });
  };

  const filterReviews = (filter: string) => {
    switch (filter) {
      case "pending":
        return reviews.filter(r => !r.replied);
      case "5star":
        return reviews.filter(r => r.rating === 5);
      case "low":
        return reviews.filter(r => r.rating <= 3);
      default:
        return reviews;
    }
  };

  const ReviewCard = ({ review }: { review: OwnerReview }) => (
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

            {review.replied && review.reply && (
              <div className="mt-3 p-3 rounded-lg bg-secondary/50 border-l-2 border-primary">
                <p className="text-xs font-medium text-primary mb-1">Your Reply:</p>
                <p className="text-sm text-muted-foreground">{review.reply}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!review.replied && (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => handleReply(review)}>
                <MessageSquare className="h-4 w-4" />
                Reply
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => handleFlag(review.id)}>
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout title="Reviews" subtitle="Monitor and respond to customer feedback">
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading reviews...</span>
        </div>
      ) : (
      <>
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

        {["all", "pending", "5star", "low"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filterReviews(tab).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {filterReviews(tab).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No reviews in this category.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              Respond to {selectedReview?.author}'s review
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${star <= selectedReview.rating ? "fill-rating text-rating" : "text-muted"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{selectedReview.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedReview.text}</p>
              </div>
              <Textarea
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReplyDialogOpen(false)} disabled={replying}>Cancel</Button>
                <Button onClick={submitReply} className="gap-2" disabled={replying || !replyText.trim()}>
                  {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {replying ? "Sending…" : "Send Reply"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </>
      )}
    </AdminLayout>
  );
};

export default AdminReviews;
