-- Seeding de usuario administrador por defecto
-- Email: admin@bachesrd.com
-- Contraseña por defecto: admin123 (hash BCrypt)
INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo)
VALUES (
    '00000000-0000-0000-0000-0000-00000001',
    'Administrador Baches RD',
    'admin@bachesrd.com',
    '$2a$10$.IppUBG/tViIAuPNp3knsOghzIRuXW8oReU2eVXcvFh4Bofmh1fkG',
    'ADMIN',
    true
)
ON CONFLICT (email) DO NOTHING;
