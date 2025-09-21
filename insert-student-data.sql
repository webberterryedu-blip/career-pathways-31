-- Script para inserir dados dos estudantes no banco de dados Supabase
-- Este script mapeia os dados fornecidos para a estrutura da tabela estudantes

-- Primeiro, vamos verificar a estrutura da tabela estudantes
-- Campos disponíveis na tabela estudantes:
-- id, user_id, nome, genero, cargo, ativo, menor, familia_id, qualificacoes, 
-- ultima_designacao, contador_designacoes, data_nascimento, responsavel_primario, 
-- responsavel_secundario, created_at, updated_at

-- Os dados fornecidos contêm os seguintes campos:
-- family_id, user_id, nome, familia, idade, genero, email, telefone, data_batismo, 
-- tempo, cargo, ativo, observacoes, created_at, updated_at, estado_civil, papel_familiar, 
-- id_pai, id_mae, id_conjuge, coabitacao, menor, responsavel_primario, responsavel_secundario, 
-- chairman, pray, tresures, gems, reading, starting, following, making, explaining, talk, 
-- data_nascimento, data_de_matricula

-- Vamos criar os registros na tabela estudantes com os campos mapeados adequadamente:

-- Exemplo de inserção (você pode adicionar mais registros conforme necessário):
INSERT INTO public.estudantes (
  id, 
  user_id, 
  nome, 
  genero, 
  cargo, 
  ativo, 
  menor, 
  familia_id, 
  qualificacoes, 
  data_nascimento, 
  responsavel_primario, 
  responsavel_secundario, 
  created_at, 
  updated_at
) VALUES 
-- Família Almeida
('384e1bd0-1a82-46cf-b301-18cae9889984', '384e1bd0-1a82-46cf-b301-18cae9889984', 'Fernanda Almeida', 'feminino', 'estudante_nova', TRUE, FALSE, '78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": true, "making": true, "explaining": true, "talk": true}', 
  '1987-08-25', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('da834686-e4d1-405e-9f72-e65b3ba094cd', 'da834686-e4d1-405e-9f72-e65b3ba094cd', 'Eduardo Almeida', 'masculino', 'estudante_novo', TRUE, FALSE, '78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": true, "following": true, "making": true, "explaining": true, "talk": true}', 
  '1952-09-02', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('30187638-c022-495f-a962-dd8feb520bf8', '30187638-c022-495f-a962-dd8feb520bf8', 'Thiago Almeida', 'masculino', 'estudante_novo', TRUE, TRUE, '78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": true, "starting": true, "following": true, "making": true, "explaining": true, "talk": true}', 
  '2012-08-18', '3f9fb7cc-4efe-43b6-82b6-063f5c59ce74', '6c705a63-00b8-4cfb-867d-588dfc1aa850', '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('16875735-1068-4125-a9e2-951538aeaceb', '16875735-1068-4125-a9e2-951538aeaceb', 'Carla Almeida', 'feminino', 'estudante_novo', TRUE, FALSE, '78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1999-08-22', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('6c705a63-00b8-4cfb-867d-588dfc1aa850', '6c705a63-00b8-4cfb-867d-588dfc1aa850', 'Fernanda Almeida', 'feminino', 'pioneira_regular', TRUE, FALSE, '78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1970-08-29', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('3f9fb7cc-4efe-43b6-82b6-063f5c59ce74', '3f9fb7cc-4efe-43b6-82b6-063f5c59ce74', 'Lucas Almeida', 'masculino', 'publicador_batizado', TRUE, FALSE, '78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 
  '{"chairman": false, "pray": true, "tresures": false, "gems": true, "reading": false, "starting": true, "following": true, "making": true, "explaining": true, "talk": true}', 
  '1999-08-22', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('3344831c-51aa-44b5-becd-cd5cf31a4a9d', '3344831c-51aa-44b5-becd-cd5cf31a4a9d', 'Larissa Almeida', 'feminino', 'publicadora_batizada', TRUE, FALSE, '78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1971-08-29', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('1d78db2c-089c-41eb-af78-a064c4c73dcb', '1d78db2c-089c-41eb-af78-a064c4c73dcb', 'Felipe Almeida', 'masculino', 'servo_ministerial', TRUE, FALSE, '78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 
  '{"chairman": false, "pray": true, "tresures": true, "gems": true, "reading": false, "starting": true, "following": true, "making": true, "explaining": true, "talk": true}', 
  '2002-08-21', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

-- Família Costa
('e8182ff8-6777-4497-a354-8f8df68c2b19', 'e8182ff8-6777-4497-a354-8f8df68c2b19', 'Patrícia Costa', 'feminino', 'estudante_nova', TRUE, FALSE, '11c5bc9d-5476-483f-b4f0-537ed70ade51', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1991-08-24', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('f994e0fe-850f-42a0-bba2-2aa822d69ef5', 'f994e0fe-850f-42a0-bba2-2aa822d69ef5', 'Beatriz Costa', 'feminino', 'estudante_nova', TRUE, FALSE, '11c5bc9d-5476-483f-b4f0-537ed70ade51', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1973-08-28', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('c6f96322-452c-4d41-be43-4fe0ac24a571', 'c6f96322-452c-4d41-be43-4fe0ac24a571', 'Rafael Costa', 'masculino', 'estudante_novo', TRUE, TRUE, '11c5bc9d-5476-483f-b4f0-537ed70ade51', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": true, "starting": true, "following": true, "making": true, "explaining": true, "talk": true}', 
  '2011-08-19', 'f994e0fe-850f-42a0-bba2-2aa822d69ef5', '0a0d2daa-002f-40a2-9fb9-edfa98f480c6', '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('8b91e35d-072d-4159-910b-c625a1b18733', '8b91e35d-072d-4159-910b-c625a1b18733', 'Beatriz Costa', 'feminino', 'pioneira_regular', TRUE, FALSE, '11c5bc9d-5476-483f-b4f0-537ed70ade51', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1995-08-23', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('1b09eddc-8d9d-48b4-bcf1-4e4bc24d69e6', '1b09eddc-8d9d-48b4-bcf1-4e4bc24d69e6', 'Carla Costa', 'feminino', 'pioneira_regular', TRUE, FALSE, '11c5bc9d-5476-483f-b4f0-537ed70ade51', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1951-09-03', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('f9b641c8-84ff-44b5-91e6-13dd94083084', 'f9b641c8-84ff-44b5-91e6-13dd94083084', 'Patrícia Costa', 'feminino', 'pioneira_regular', TRUE, FALSE, '11c5bc9d-5476-483f-b4f0-537ed70ade51', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1993-08-26', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('0a0d2daa-002f-40a2-9fb9-edfa98f480c6', '0a0d2daa-002f-40a2-9fb9-edfa98f480c6', 'Gabriel Costa', 'masculino', 'publicador_batizado', TRUE, FALSE, '11c5bc9d-5476-483f-b4f0-537ed70ade51', 
  '{"chairman": false, "pray": true, "tresures": false, "gems": false, "reading": true, "starting": true, "following": true, "making": true, "explaining": true, "talk": true}', 
  '1973-08-28', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('31cb4d8a-3b73-4b4b-997a-69c63790a553', '31cb4d8a-3b73-4b4b-997a-69c63790a553', 'Ana Costa', 'feminino', 'publicadora_batizada', TRUE, FALSE, '11c5bc9d-5476-483f-b4f0-537ed70ade51', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1998-08-22', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('9f0be970-27d8-40d1-898f-cceb62d7b530', '9f0be970-27d8-40d1-898f-cceb62d7b530', 'Juliana Costa', 'feminino', 'publicadora_batizada', TRUE, FALSE, '11c5bc9d-5476-483f-b4f0-537ed70ade51', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1991-08-24', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

-- Família Goes
('1ff3b546-c5a1-47f1-b907-60b0961ee8a9', '1ff3b546-c5a1-47f1-b907-60b0961ee8a9', 'Juliana Oliveira Goes', 'feminino', 'estudante_nova', TRUE, FALSE, 'b88f6190-0194-414f-b85e-68823d68a317', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1984-08-25', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('fa855c96-0124-4752-875e-7c2933cf407d', 'fa855c96-0124-4752-875e-7c2933cf407d', 'Carla Oliveira Goes', 'feminino', 'estudante_nova', TRUE, FALSE, 'b88f6190-0194-414f-b85e-68823d68a317', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '2007-08-20', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('e0536814-7c3e-4675-87a3-d6cff1f6adc3', 'e0536814-7c3e-4675-87a3-d6cff1f6adc3', 'Juliana Oliveira Goes', 'feminino', 'pioneira_regular', TRUE, FALSE, 'b88f6190-0194-414f-b85e-68823d68a317', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1953-09-02', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('c86c94d4-e119-4919-9f6b-7c7629e6d69f', 'c86c94d4-e119-4919-9f6b-7c7629e6d69f', 'Carla Oliveira Goes', 'feminino', 'pioneira_regular', TRUE, FALSE, 'b88f6190-0194-414f-b85e-68823d68a317', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1973-08-28', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('211b76d9-8a2b-4bdd-b0c4-93311c351265', '211b76d9-8a2b-4bdd-b0c4-93311c351265', 'Carla Oliveira Goes', 'feminino', 'pioneira_regular', TRUE, FALSE, 'b88f6190-0194-414f-b85e-68823d68a317', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1981-08-26', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('e9ea98e4-5833-46fd-9aba-dfe22e8a4b12', 'e9ea98e4-5833-46fd-9aba-dfe22e8a4b12', 'Beatriz Oliveira Goes', 'feminino', 'publicadora_batizada', TRUE, FALSE, 'b88f6190-0194-414f-b85e-68823d68a317', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '2006-08-20', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

-- Família Gomes
('8c3813d7-4191-4b2d-81d0-618d9ff2c4be', '8c3813d7-4191-4b2d-81d0-618d9ff2c4be', 'André Gomes', 'masculino', 'anciao', TRUE, FALSE, '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d', 
  '{"chairman": true, "pray": true, "tresures": true, "gems": true, "reading": false, "starting": true, "following": true, "making": true, "explaining": true, "talk": true}', 
  '1968-08-29', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('ae709551-ba64-44ed-8dd1-4bf1c4d2cc06', 'ae709551-ba64-44ed-8dd1-4bf1c4d2cc06', 'Eduardo Gomes', 'masculino', 'anciao', TRUE, FALSE, '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d', 
  '{"chairman": true, "pray": true, "tresures": true, "gems": true, "reading": false, "starting": true, "following": true, "making": true, "explaining": true, "talk": true}', 
  '1979-08-27', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('c27b65f7-f7d9-49fe-aa24-2c50e699581a', 'c27b65f7-f7d9-49fe-aa24-2c50e699581a', 'Larissa Gomes', 'feminino', 'pioneira_regular', TRUE, FALSE, '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1979-08-27', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50'),

('9e4ab2e3-98ca-4e69-ace1-f9278aa12e01', '9e4ab2e3-98ca-4e69-ace1-f9278aa12e01', 'Camila Gomes', 'feminino', 'pioneira_regular', TRUE, FALSE, '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d', 
  '{"chairman": false, "pray": false, "tresures": false, "gems": false, "reading": false, "starting": false, "following": false, "making": false, "explaining": true, "talk": true}', 
  '1964-08-30', NULL, NULL, '2025-08-15 15:31:50', '2025-08-15 15:31:50');

-- Verificar os dados inseridos
SELECT COUNT(*) as total_estudantes FROM public.estudantes;
SELECT * FROM public.estudantes ORDER BY created_at DESC LIMIT 10;