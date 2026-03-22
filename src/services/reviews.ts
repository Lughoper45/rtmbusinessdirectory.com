import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  text: string;
  author_name: string;
  author_avatar: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewInput {
  business_id: string;
  rating: number;
  text: string;
  author_name: string;
}

export async function getReviewsForBusiness(
  businessId: string,
  limit = 20,
  offset = 0
): Promise<{ reviews: Review[]; total: number }> {
  const { data, error, count } = await (supabase as any)
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  return {
    reviews: (data as Review[]) || [],
    total: count || 0,
  };
}

export async function createReview(
  review: ReviewInput,
  userId: string
): Promise<{ success: boolean; review?: Review; error?: string }> {
  const { data, error } = await (supabase as any)
    .from('reviews')
    .insert({
      ...review,
      user_id: userId,
      is_verified: false,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await updateBusinessRating(review.business_id);

  return { success: true, review: data as Review };
}

export async function updateReview(
  reviewId: string,
  updates: Partial<ReviewInput>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('reviews')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteReview(
  reviewId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: review } = await (supabase as any)
    .from('reviews')
    .select('business_id')
    .eq('id', reviewId)
    .single();

  const { error } = await (supabase as any)
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  if (review) {
    await updateBusinessRating(review.business_id);
  }

  return { success: true };
}

export async function markReviewHelpful(
  reviewId: string
): Promise<{ success: boolean }> {
  const { error } = await (supabase as any)
    .from('review_helpful')
    .insert({ review_id: reviewId });

  return { success: !error };
}

export async function reportReview(
  reviewId: string,
  reason: string,
  userId: string
): Promise<{ success: boolean }> {
  const { error } = await (supabase as any)
    .from('review_reports')
    .insert({
      review_id: reviewId,
      reason,
      reporter_id: userId,
    });

  return { success: !error };
}

async function updateBusinessRating(businessId: string): Promise<void> {
  const { data, error } = await (supabase as any)
    .from('reviews')
    .select('rating')
    .eq('business_id', businessId);

  if (error || !data?.length) return;

  const total = data.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
  const avgRating = total / data.length;

  await (supabase as any)
    .from('businesses')
    .update({
      rating: Math.round(avgRating * 10) / 10,
      review_count: data.length,
      updated_at: new Date().toISOString(),
    })
    .eq('business_id', businessId);
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  const { data, error } = await (supabase as any)
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }

  return (data as Review[]) || [];
}

export async function hasUserReviewedBusiness(
  userId: string,
  businessId: string
): Promise<boolean> {
  const { data } = await (supabase as any)
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .single();

  return !!data;
}
