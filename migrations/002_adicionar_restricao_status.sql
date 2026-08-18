ALTER TABLE livros
ADD CONSTRAINT livros_status_valido
CHECK (status IN ('quero ler', 'lendo', 'lido'));