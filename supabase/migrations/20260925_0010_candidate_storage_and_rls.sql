-- Phase 4 candidate storage: private CV bucket and user-scoped object policies.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-cvs',
  'candidate-cvs',
  FALSE,
  10485760,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 10485760,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Candidates upload own CV files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Candidates read own CV files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'candidate-cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Candidates update own CV files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'candidate-cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'candidate-cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Candidates delete own CV files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'candidate-cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
