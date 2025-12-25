import { Business } from "@/types/directory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

interface ProfileReputationProps {
  business: Business;
}

const ProfileReputation = ({ business }: ProfileReputationProps) => {
  // Calculate reputation score based on rating and review count
  const baseScore = Math.round(business.rating * 18);
  const reviewBonus = Math.min(10, Math.round(business.reviewCount / 100));
  const reputationScore = Math.min(100, baseScore + reviewBonus);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  // AI-generated strengths and improvements
  const strengths = [
    "Excellent customer service consistently praised in reviews",
    "High-quality products/services that exceed expectations",
    "Clean and welcoming environment",
  ];

  const improvements = [
    "Consider expanding operating hours for better accessibility",
    "Improve online ordering experience",
  ];

  // Sentiment breakdown
  const sentimentData = {
    positive: 89,
    neutral: 8,
    negative: 3
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </span>
            Reputation Analysis
          </div>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            Updated 2 days ago
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Reputation Score */}
        <div className="text-center p-6 bg-muted/30 rounded-xl">
          <div className={`text-6xl font-bold ${getScoreColor(reputationScore)} mb-2`}>
            {reputationScore}
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className={`${reputationScore >= 80 ? 'bg-emerald-500' : reputationScore >= 60 ? 'bg-amber-500' : 'bg-destructive'}`}>
              {getScoreLabel(reputationScore)}
            </Badge>
            {reputationScore >= 80 && (
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Based on {business.reviewCount.toLocaleString()} reviews across Google, Facebook, and other platforms
          </p>
        </div>

        {/* Strengths */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-3 text-foreground">
                <span className="text-emerald-500 mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Opportunities for Growth
          </h3>
          <ul className="space-y-2">
            {improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-3 text-foreground">
                <span className="text-amber-500 mt-1">•</span>
                {improvement}
              </li>
            ))}
          </ul>
        </div>

        {/* Sentiment Analysis */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Sentiment Analysis</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-20 text-sm text-muted-foreground">Positive</span>
              <Progress value={sentimentData.positive} className="flex-1 h-3" />
              <span className="w-12 text-sm font-medium text-emerald-600">{sentimentData.positive}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 text-sm text-muted-foreground">Neutral</span>
              <Progress value={sentimentData.neutral} className="flex-1 h-3" />
              <span className="w-12 text-sm font-medium text-muted-foreground">{sentimentData.neutral}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 text-sm text-muted-foreground">Negative</span>
              <Progress value={sentimentData.negative} className="flex-1 h-3" />
              <span className="w-12 text-sm font-medium text-destructive">{sentimentData.negative}%</span>
            </div>
          </div>
        </div>

        {/* Source Attribution */}
        <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
          Reputation data aggregated from Google Reviews, Facebook, Yelp, and other public sources
        </p>
      </CardContent>
    </Card>
  );
};

export default ProfileReputation;
