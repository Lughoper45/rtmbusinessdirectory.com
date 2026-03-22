-- Reviews table for business reviews
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text NOT NULL DEFAULT '',
  author_name text NOT NULL,
  author_avatar text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_business_id_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(business_id) ON DELETE CASCADE,
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Review helpful votes
CREATE TABLE public.review_helpful (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_helpful_review_id_fkey FOREIGN KEY (review_id) 
    REFERENCES public.reviews(id) ON DELETE CASCADE,
  CONSTRAINT review_helpful_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT review_helpful_unique UNIQUE (review_id, user_id)
);

-- Review reports for moderation
CREATE TABLE public.review_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_reports_review_id_fkey FOREIGN KEY (review_id) 
    REFERENCES public.reviews(id) ON DELETE CASCADE,
  CONSTRAINT review_reports_reporter_id_fkey FOREIGN KEY (reporter_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Business claims table
CREATE TABLE public.business_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_token text NOT NULL,
  business_email text NOT NULL,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT business_claims_business_id_fkey FOREIGN KEY (business_id) 
    REFERENCES public.businesses(business_id) ON DELETE CASCADE,
  CONSTRAINT business_claims_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT business_claims_unique UNIQUE (business_id, user_id)
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

-- Review policies
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Review helpful policies
CREATE POLICY "Anyone can mark reviews as helpful"
  ON public.review_helpful FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Review reports policies
CREATE POLICY "Authenticated users can report reviews"
  ON public.review_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Business claims policies
CREATE POLICY "Authenticated users can submit claims"
  ON public.business_claims FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Claim owners can view their claims"
  ON public.business_claims FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for reviews
CREATE INDEX idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating DESC);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- Indexes for claims
CREATE INDEX idx_claims_business_id ON public.business_claims(business_id);
CREATE INDEX idx_claims_status ON public.business_claims(status);
CREATE INDEX idx_claims_token ON public.business_claims(verification_token);
