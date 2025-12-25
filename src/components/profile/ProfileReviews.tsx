import { useState } from "react";
import { Business } from "@/types/directory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, ThumbsUp, Flag, Filter } from "lucide-react";

interface ProfileReviewsProps {
  business: Business;
}

// Mock reviews data
const mockReviews = [
  {
    id: "1",
    author: "Sarah M.",
    avatar: "SM",
    rating: 5,
    date: "2 days ago",
    text: "Absolutely incredible experience! The food was amazing and the service was impeccable. We celebrated our anniversary here and couldn't have asked for a better evening. Will definitely be coming back!",
    helpful: 24,
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400"],
    verified: true
  },
  {
    id: "2",
    author: "James T.",
    avatar: "JT",
    rating: 5,
    date: "1 week ago",
    text: "Best in the city, hands down. The attention to detail is remarkable and the staff really knows their stuff. Highly recommend!",
    helpful: 18,
    verified: true
  },
  {
    id: "3",
    author: "Emma L.",
    avatar: "EL",
    rating: 4,
    date: "2 weeks ago",
    text: "Great overall experience. The quality was excellent, though the wait time was a bit longer than expected. Still, would recommend to anyone looking for quality.",
    helpful: 12,
    verified: false
  },
  {
    id: "4",
    author: "Michael R.",
    avatar: "MR",
    rating: 5,
    date: "3 weeks ago",
    text: "Outstanding! This is exactly what we were looking for. Professional, friendly, and delivered beyond our expectations. Thank you!",
    helpful: 31,
    verified: true
  }
];

const ProfileReviews = ({ business }: ProfileReviewsProps) => {
  const [filter, setFilter] = useState<"all" | "positive" | "critical">("all");

  const renderStars = (rating: number, size: "sm" | "md" = "md") => {
    const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`${sizeClass} ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} 
      />
    ));
  };

  // Rating distribution
  const ratingDistribution = [
    { stars: 5, percentage: 72, count: Math.round(business.reviewCount * 0.72) },
    { stars: 4, percentage: 18, count: Math.round(business.reviewCount * 0.18) },
    { stars: 3, percentage: 6, count: Math.round(business.reviewCount * 0.06) },
    { stars: 2, percentage: 3, count: Math.round(business.reviewCount * 0.03) },
    { stars: 1, percentage: 1, count: Math.round(business.reviewCount * 0.01) },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </span>
            Reviews
          </div>
          <Badge variant="secondary" className="text-sm font-normal">
            {business.reviewCount.toLocaleString()} reviews
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/30 rounded-xl">
          {/* Overall Rating */}
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-foreground mb-2">{business.rating}</div>
            <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
              {renderStars(business.rating)}
            </div>
            <p className="text-muted-foreground">
              Based on {business.reviewCount.toLocaleString()} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-12">{item.stars} star</span>
                <Progress value={item.percentage} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Reviews
          </Button>
          <Button 
            variant={filter === "positive" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter("positive")}
          >
            Positive (4-5★)
          </Button>
          <Button 
            variant={filter === "critical" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter("critical")}
          >
            Critical (1-3★)
          </Button>
          <Button variant="outline" size="sm" className="gap-2 ml-auto">
            <Filter className="w-4 h-4" />
            Sort by
          </Button>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {mockReviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {review.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{review.author}</span>
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                        Verified
                      </Badge>
                    )}
                    <span className="text-muted-foreground text-sm">• {review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {renderStars(review.rating, "sm")}
                  </div>
                  <p className="text-foreground leading-relaxed mb-3">{review.text}</p>
                  
                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((img, index) => (
                        <img 
                          key={index}
                          src={img} 
                          alt="Review photo"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Review Actions */}
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      Helpful ({review.helpful})
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <Button variant="outline" className="w-full">
          Load More Reviews
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileReviews;
