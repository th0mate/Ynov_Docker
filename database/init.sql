CREATE TABLE IF NOT EXISTS todos (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL CHECK (char_length(btrim(title)) > 0),
  completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Quelques tâches pour ne pas démarrer sur une liste vide
INSERT INTO todos (title, completed) VALUES
  ('Lire la documentation de docker compose', TRUE),
  ('Écrire les tests du backend', FALSE),
  ('Préparer la soutenance', FALSE);
