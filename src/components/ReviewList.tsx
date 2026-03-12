import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { reviewsApi, Review } from "@/services/reviewsApi";

interface ReviewListProps {
  propertyId: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReviewList({ propertyId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    const fetchReviews = async () => {
      try {
        const res = await reviewsApi.getPropertyReviews(propertyId);
        setReviews(res.reviews);
        setAvgRating(res.avgRating);
        setTotal(res.total);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Loading reviews…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <span className="text-xl font-bold">{avgRating}</span>
        </div>
        <span className="text-muted-foreground">
          {total} review{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{review.author}</p>
                    {review.pet_name && (
                      <p className="text-xs text-muted-foreground">
                        Pet: {review.pet_name}
                        {review.service_type ? ` · ${review.service_type}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDate(review.created_at)}
                  </span>
                </div>

                <StarRating rating={review.rating} />

                {review.comment && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {/* Owner reply */}
                {review.reply && (
                  <div className="ml-4 pl-4 border-l-2 border-primary/30 mt-3">
                    <p className="text-xs font-semibold text-primary mb-1">
                      Owner Reply
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {review.reply}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
