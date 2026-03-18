CREATE POLICY "Authenticated users can delete businesses"
ON public.businesses
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);