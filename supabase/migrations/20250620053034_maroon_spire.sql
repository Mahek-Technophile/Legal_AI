/*
  # Document Analysis Tables

  1. New Tables
    - `document_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `file_name` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `jurisdiction` (text)
      - `analysis_result` (jsonb)
      - `risk_level` (text)
      - `risk_score` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `batch_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `status` (text)
      - `total_files` (integer)
      - `completed_files` (integer)
      - `results` (jsonb)
      - `errors` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create document_analyses table
CREATE TABLE IF NOT EXISTS document_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  jurisdiction text NOT NULL,
  analysis_result jsonb NOT NULL,
  risk_level text NOT NULL,
  risk_score integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create batch_analyses table
CREATE TABLE IF NOT EXISTS batch_analyses (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total_files integer NOT NULL DEFAULT 0,
  completed_files integer NOT NULL DEFAULT 0,
  results jsonb DEFAULT '[]',
  errors jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_analyses
CREATE POLICY "Users can view own document analyses"
  ON document_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document analyses"
  ON document_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document analyses"
  ON document_analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own document analyses"
  ON document_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for batch_analyses
CREATE POLICY "Users can view own batch analyses"
  ON batch_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batch analyses"
  ON batch_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch analyses"
  ON batch_analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batch analyses"
  ON batch_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_document_analyses_updated_at
  BEFORE UPDATE ON document_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_analyses_updated_at
  BEFORE UPDATE ON batch_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_analyses_user_id ON document_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_created_at ON document_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_document_analyses_risk_level ON document_analyses(risk_level);
CREATE INDEX IF NOT EXISTS idx_document_analyses_jurisdiction ON document_analyses(jurisdiction);

CREATE INDEX IF NOT EXISTS idx_batch_analyses_user_id ON batch_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_analyses_created_at ON batch_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_batch_analyses_status ON batch_analyses(status);