-- Create businesses table matching the Business type
CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL UNIQUE, -- e.g. "biz-00001"
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  logo text,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  price_range text NOT NULL DEFAULT '$$',
  address text NOT NULL DEFAULT '',
  city text NOT NULL,
  province text NOT NULL,
  distance numeric(4,1),
  is_open boolean NOT NULL DEFAULT true,
  closing_time text,
  phone text,
  website text,
  is_verified boolean NOT NULL DEFAULT false,
  is_world_cup_ready boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  is_award_winner boolean NOT NULL DEFAULT false,
  features text[] NOT NULL DEFAULT '{}',
  ownership text[] NOT NULL DEFAULT '{}',
  cuisine text,
  recent_review_text text,
  recent_review_author text,
  recent_review_rating integer,
  lat numeric(10,6),
  lng numeric(10,6),
  photos text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Public read access (directory is public)
CREATE POLICY "Businesses are publicly readable"
  ON public.businesses FOR SELECT
  USING (true);

-- Only authenticated users can insert (for admin/claiming later)
CREATE POLICY "Authenticated users can insert businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update their own (placeholder for claiming)
CREATE POLICY "Authenticated users can update businesses"
  ON public.businesses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Index for common queries
CREATE INDEX idx_businesses_city ON public.businesses(city);
CREATE INDEX idx_businesses_category ON public.businesses(category);
CREATE INDEX idx_businesses_rating ON public.businesses(rating DESC);
CREATE INDEX idx_businesses_business_id ON public.businesses(business_id);

-- Full text search index
CREATE INDEX idx_businesses_search ON public.businesses 
  USING GIN (to_tsvector('english', name || ' ' || category || ' ' || city));

-- Trigger for updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
