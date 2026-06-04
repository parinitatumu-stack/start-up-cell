
CREATE POLICY "pitch decks owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pitch-decks' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(),'admin')));
CREATE POLICY "pitch decks owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "pitch decks owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "pitch decks owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
