CREATE POLICY "Users can create own affiliate"
ON affiliates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate"
ON affiliates
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
