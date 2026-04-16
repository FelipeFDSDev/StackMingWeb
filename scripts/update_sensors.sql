-- Remover sensores antigos
DELETE FROM sensors;

-- Inserir sensores por métrica (correspondendo ao script Python)
INSERT INTO sensors (id, name, location, status, battery, signal_strength, created_at) VALUES
('temperatura', 'Sensor Temperatura', 'Métrica', 'online', 95, 88, NOW()),
('umidade', 'Sensor Umidade', 'Métrica', 'online', 92, 85, NOW()),
('luminosidade', 'Sensor Luminosidade', 'Métrica', 'online', 88, 90, NOW()),
('qualidade_ar', 'Sensor Qualidade Ar', 'Métrica', 'online', 85, 82, NOW());
