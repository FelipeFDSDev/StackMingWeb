-- Criar sensores iniciais para o dashboard
INSERT IGNORE INTO sensors (id, name, location, status, battery, signal_strength, created_at) VALUES
('s1', 'Sensor Sala', 'Sala Principal', 'online', 85, 92, NOW()),
('s2', 'Sensor Cozinha', 'Cozinha', 'online', 78, 88, NOW()),
('s3', 'Sensor Quarto', 'Quarto 1', 'online', 92, 95, NOW()),
('s4', 'Sensor Banheiro', 'Banheiro', 'offline', 45, 65, NOW()),
('s5', 'Sensor Externo', 'Jardim', 'online', 67, 78, NOW());
