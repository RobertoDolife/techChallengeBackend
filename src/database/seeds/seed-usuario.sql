-- seed-usuario.sql
-- Atenção: para ambiente de testes apenas.
-- Senha para todos: senha123 (criptografada com bcrypt)

START TRANSACTION;

-- limpa (opcional)
-- TRUNCATE TABLE `usuario`;

-- popula com dados falsos (inclui data_atualizacao)
INSERT INTO `usuario` (`nome`, `email`, `senha`, `admin`, `data_criacao`, `data_atualizacao`) VALUES
('Roberto Silva',      'roberto.silva@example.com',     '$2b$10$ccg4pYE8Wn.Qg3XIXf1HauvlNvbWwu5vZwTRTc3lhDsf4ane7q2UK', false, '2025-09-01 10:12:00', '2025-09-01 10:12:00'),
('Maria Souza',        'maria.souza@example.com',       '$2b$10$Du2iWsbkFX7EhXq/5.86e.vpxMvXS/aNlx73wci62.Kahxs23wuXi', false, '2025-09-05 14:30:00', '2025-09-05 14:30:00'),
('Ana Pereira',        'ana.pereira@example.com',       '$2b$10$6Cub9TXqDvyLWTwNq.O2i./Hi6c.NhLogob6UdWYrz8SsXJlMW0a6', false, '2025-08-22 09:05:00', '2025-08-22 09:05:00'),
('Carlos Oliveira',    'carlos.oliveira@example.com',   '$2b$10$hzz.AYMRtMQ9ob0G5gUqY.wdCVGT5eEgt4Wfr6HVUHBtNAX71.nCW', false, '2025-07-11 16:20:00', '2025-07-11 16:20:00'),
('Mariana Costa',      'mariana.costa@example.com',     '$2b$10$pxXv8PQCMUPhSMJd.RpYJ.P6y2twHcCW9TaCaD/EdJOucFSC53nSG', false, '2025-09-10 08:45:00', '2025-09-10 08:45:00'),
('Felipe Almeida',     'felipe.almeida@example.com',    '$2b$10$uTd3CTzH8rkDluYDs6cVo.269D.RETgvfVW8SkWd9fsEK87BKNxh2', false, '2025-06-30 12:00:00', '2025-06-30 12:00:00'),
('Juliana Rocha',      'juliana.rocha@example.com',     '$2b$10$kxhXPYK8Vj2yskxi141c8O8o0x8zWUE9t9TcIsmXnW5YP2CpccYa.', false, '2025-09-12 21:10:00', '2025-09-12 21:10:00'),
('Pedro Santos',       'pedro.santos@example.com',      '$2b$10$F1fIP3YH4222ZiH6CIp30eTxXJ0qx6xIHQlw3m6U3HFYpodXmylkm', false, '2025-05-03 11:25:00', '2025-05-03 11:25:00'),
('Larissa Ferreira',   'larissa.ferreira@example.com',  '$2b$10$2aeQ.T4aEbb4fC.qM0sDP.PDBDyCKejFluLIc..0ZKgMcFcXsy4DK', false, '2025-09-15 13:00:00', '2025-09-15 13:00:00'),
('Gustavo Martins',    'gustavo.martins@example.com',   '$2b$10$5QfCsLRRAHOOimEHXTAxwO8PLEW5NUy7MOqFtkQhoi7TNsMivHAKi', false, '2025-04-18 07:40:00', '2025-04-18 07:40:00'),
('Beatriz Gomes',      'beatriz.gomes@example.com',     '$2b$10$z2zraarptxff4.2GlFxG1eoAy98N5k4t6YQwwA3qOAwIPew7BT.Le', false, '2025-09-18 19:22:00', '2025-09-18 19:22:00'),
('Rafael Almeida',     'rafael.almeida@example.com',    '$2b$10$67sUqWKMX.o/b1wIyV0RrOyRLFUzIotiUdPMGs7qDK.90fDj.nWnW', false, '2025-03-29 15:55:00', '2025-03-29 15:55:00'),
('Patrícia Nunes',     'patricia.nunes@example.com',    '$2b$10$brG3arDiChCuSzHWEIBU3.zE.RBJwF.1RYriANdBvzL3xGmS7X78K', false, '2025-09-20 09:33:00', '2025-09-20 09:33:00'),
('André Ribeiro',      'andre.ribeiro@example.com',     '$2b$10$m/j37Cf9Bl9VfXyw3pryzONjNQyQf50n9Rrt2J1EbTdZo3uE9vJz6', false, '2025-02-14 10:00:00', '2025-02-14 10:00:00'),
('Sofia Barros',       'sofia.barros@example.com',      '$2b$10$cMKeCFcY2ovgGu3CI7JHXO/3mRGuSuoXKu55aoCVJ2VfymrAMuj1q', false, '2025-09-21 22:05:00', '2025-09-21 22:05:00'),
('Lucas Ferreira',     'lucas.ferreira@example.com',    '$2b$10$J9UGpR/R02.SUJk90S5r.uDgzftTrlWzy5OpPAgljs3cy4UjiUAzy', false, '2025-01-01 00:00:00', '2025-01-01 00:00:00'),
('Camila Pinto',       'camila.pinto@example.com',      '$2b$10$eizWHMFbEnBI0T3cb6Kon.hD9YhchSVe5a8YNZucurq0.rWECsDZ.', false, '2025-08-05 18:18:00', '2025-08-05 18:18:00'),
('Mateus Cardoso',     'mateus.cardoso@example.com',    '$2b$10$lWQhsTD/uccNeYTAxWuFK.LP6xjo0iwj.BdJff8AFTks2MPZq8Y4q', false, '2025-07-25 06:06:00', '2025-07-25 06:06:00'),
('Isabela Duarte',     'isabela.duarte@example.com',    '$2b$10$tw10Y7.h7XQTJCKlNZWwIOmPGKrNzm0lmbiYZn.B3JOkC7a6KYq82', false, '2025-09-25 12:12:00', '2025-09-25 12:12:00'),
('Thiago Moreira',     'thiago.moreira@example.com',    '$2b$10$zrHC0qiECIVIL.a8e7FLTOS5o/zXj1.2Y8RRvsvjd2E7QK1A/1uUy', false, '2025-09-28 17:40:00', '2025-09-28 17:40:00');

-- ajusta auto_increment (opcional)
ALTER TABLE `usuario` AUTO_INCREMENT = 1001;

COMMIT;
