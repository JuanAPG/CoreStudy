--
-- PostgreSQL database dump
--

-- ============================================================
-- NUEVO: Inserción de usuarios administradores
-- Contraseñas hasheadas con bcrypt (cost 12)
-- Correos:  @corestudy.com
-- Passwords sin hashear (solo para referencia):
--   admin@corestudy.com      → Admin#2026
--   superadmin@corestudy.com → Super#2026
--   director@corestudy.com   → Director#2026
-- ============================================================

\restrict agUKsGdG7IQRSLT3iRGLBIXz0iLJgyTNgYMWRGROhIXxMiFVHEaIsYj6vds9K8q

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================
-- Creación de tablas según diagrama ER
-- ============================================================

-- Agrega columna rol si la tabla ya existía sin ella
ALTER TABLE IF EXISTS usuario
  ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'estudiante';
CREATE TABLE IF NOT EXISTS Usuario (
    user_ID    SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    correo     VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol        VARCHAR(20)  NOT NULL DEFAULT 'estudiante'
);

CREATE TABLE IF NOT EXISTS Mazo (
    mazo_ID        SERIAL PRIMARY KEY,
    user_ID        INTEGER NOT NULL REFERENCES Usuario(user_ID) ON DELETE CASCADE,
    materia        VARCHAR(100),
    titulo         VARCHAR(200) NOT NULL,
    descripcion    TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Archivo (
    archivo_ID   SERIAL PRIMARY KEY,
    mazo_id      INTEGER NOT NULL REFERENCES Mazo(mazo_ID) ON DELETE CASCADE,

    user_ID      INTEGER NOT NULL REFERENCES Usuario(user_ID) ON DELETE CASCADE,
    nombre       VARCHAR(200) NOT NULL,
    materia      VARCHAR(100),
    tipo_archivo VARCHAR(50),
    ruta         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Tarjetas (
    tarjeta_ID  SERIAL PRIMARY KEY,
    mazo_id     INTEGER NOT NULL REFERENCES Mazo(mazo_ID) ON DELETE CASCADE,
    frente      TEXT NOT NULL,
    verso       TEXT NOT NULL,
    dificultad  VARCHAR(50),
    completado  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS Sesion_estudio (
    sesion_ID   SERIAL PRIMARY KEY,
    user_ID     INTEGER NOT NULL REFERENCES Usuario(user_ID) ON DELETE CASCADE,
    mazo_ID     INTEGER NOT NULL REFERENCES Mazo(mazo_ID) ON DELETE CASCADE,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin    TIMESTAMP,
    aciertos    INTEGER NOT NULL DEFAULT 0,
    errores     INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- NUEVO: Inserción de usuarios administradores
-- Contraseñas hasheadas con bcrypt (cost 12)
-- Correos:  @corestudy.com
-- Passwords sin hashear (solo para referencia):
--   admin@corestudy.com      → Admin#2026
--   superadmin@corestudy.com → Super#2026
--   director@corestudy.com   → Director#2026
-- ============================================================

INSERT INTO usuario (nombre, correo, contrasena, rol)
VALUES
  (
    'Administrador Principal',
    'admin@corestudy.com',
    '$2b$12$GTDPILRSH57/d5QJZcmJOePtdFTqYqnjfw8P26jPo0cysV45u1XpG',
    'admin'
  ),
  (
    'Super Administrador',
    'superadmin@corestudy.com',
    '$2b$12$Yy8chMyM55uYwb9u.uc6NuT.vIhzJB9N0pHsKcsHlI8nzT9GsPuRC',
    'admin'
  ),
  (
    'Director Académico',
    'director@corestudy.com',
    '$2b$12$pNcCa1rWpO9QKNeTxQNZ6OTz72k651R2ZhwFvRk4VjJt4kCxtRyJW',
    'admin'
  )
ON CONFLICT (correo) DO NOTHING;
-- ON CONFLICT evita error si ya existen los correos

-- ============================================================
-- NUEVO: Datos semilla para estadísticas del dashboard
-- 4 mazos + 20 tarjetas + 5 sesiones de la semana actual
-- Todos los INSERTs son idempotentes (WHERE NOT EXISTS)
-- ============================================================

-- ── Mazos (4 para admin@corestudy.com) ───────────────────

INSERT INTO mazo (user_id, materia, titulo, descripcion, fecha_creacion)
SELECT u.user_id,
       'Cálculo Integral',
       'Antiderivadas e Integrales',
       'Repaso de métodos de integración indefinida',
       NOW() - INTERVAL '14 days'
FROM usuario u WHERE u.correo = 'admin@corestudy.com'
AND NOT EXISTS (
  SELECT 1 FROM mazo m JOIN usuario u2 ON m.user_id = u2.user_id
  WHERE u2.correo = 'admin@corestudy.com' AND m.titulo = 'Antiderivadas e Integrales'
);

INSERT INTO mazo (user_id, materia, titulo, descripcion, fecha_creacion)
SELECT u.user_id,
       'Programación',
       'Estructuras de Datos',
       'Pilas, colas, listas enlazadas y árboles',
       NOW() - INTERVAL '10 days'
FROM usuario u WHERE u.correo = 'admin@corestudy.com'
AND NOT EXISTS (
  SELECT 1 FROM mazo m JOIN usuario u2 ON m.user_id = u2.user_id
  WHERE u2.correo = 'admin@corestudy.com' AND m.titulo = 'Estructuras de Datos'
);

INSERT INTO mazo (user_id, materia, titulo, descripcion, fecha_creacion)
SELECT u.user_id,
       'Física',
       'Cinemática y Dinámica',
       'Movimiento, fuerzas y leyes de Newton',
       NOW() - INTERVAL '7 days'
FROM usuario u WHERE u.correo = 'admin@corestudy.com'
AND NOT EXISTS (
  SELECT 1 FROM mazo m JOIN usuario u2 ON m.user_id = u2.user_id
  WHERE u2.correo = 'admin@corestudy.com' AND m.titulo = 'Cinemática y Dinámica'
);

INSERT INTO mazo (user_id, materia, titulo, descripcion, fecha_creacion)
SELECT u.user_id,
       'Gestión',
       'Administración de Proyectos',
       'PMI, Scrum, Kanban y gestión de riesgos',
       NOW() - INTERVAL '3 days'
FROM usuario u WHERE u.correo = 'admin@corestudy.com'
AND NOT EXISTS (
  SELECT 1 FROM mazo m JOIN usuario u2 ON m.user_id = u2.user_id
  WHERE u2.correo = 'admin@corestudy.com' AND m.titulo = 'Administración de Proyectos'
);

-- ── Tarjetas (5 por mazo) ─────────────────────────────────
-- Mazo: Antiderivadas e Integrales  (3 completadas, 2 pendientes)

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué es una antiderivada?',
       'Es una función F(x) cuya derivada es la función original f(x).',
       'fácil', true
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Antiderivadas e Integrales'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué es una antiderivada?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Cómo integras x^n cuando n ≠ −1?',
       'Sumas 1 al exponente y divides entre ese nuevo valor: x^(n+1)/(n+1) + C.',
       'fácil', true
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Antiderivadas e Integrales'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Cómo integras x^n cuando n ≠ −1?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Por qué se agrega +C en una integral indefinida?',
       'Porque al derivar una constante se obtiene 0; hay infinitas antiderivadas.',
       'media', true
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Antiderivadas e Integrales'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Por qué se agrega +C en una integral indefinida?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Cuándo conviene usar sustitución trigonométrica?',
       'Cuando el integrando contiene expresiones como √(a²−x²), √(a²+x²) o √(x²−a²).',
       'difícil', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Antiderivadas e Integrales'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Cuándo conviene usar sustitución trigonométrica?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Cuál es la fórmula de integración por partes?',
       '∫u dv = uv − ∫v du. Se elige u como la función más fácil de derivar.',
       'difícil', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Antiderivadas e Integrales'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Cuál es la fórmula de integración por partes?');

-- Mazo: Estructuras de Datos  (1 completada, 4 pendientes)

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué es una pila (stack)?',
       'Estructura LIFO: el último elemento en entrar es el primero en salir.',
       'fácil', true
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Estructuras de Datos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué es una pila (stack)?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué es una cola (queue)?',
       'Estructura FIFO: el primer elemento en entrar es el primero en salir.',
       'fácil', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Estructuras de Datos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué es una cola (queue)?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Cuál es la complejidad de búsqueda en un árbol BST balanceado?',
       'O(log n) en promedio para búsqueda, inserción y eliminación.',
       'media', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Estructuras de Datos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Cuál es la complejidad de búsqueda en un árbol BST balanceado?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué diferencia hay entre lista enlazada simple y doble?',
       'La simple tiene un puntero al siguiente nodo; la doble tiene punteros al siguiente y al anterior.',
       'media', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Estructuras de Datos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué diferencia hay entre lista enlazada simple y doble?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué es un grafo dirigido?',
       'Grafo donde las aristas tienen dirección (origen → destino), también llamado dígrafo.',
       'difícil', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Estructuras de Datos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué es un grafo dirigido?');

-- Mazo: Cinemática y Dinámica  (2 completadas, 3 pendientes)

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Cuál es la primera ley de Newton?',
       'Un objeto en reposo o en movimiento uniforme permanece así a menos que actúe una fuerza neta.',
       'fácil', true
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Cinemática y Dinámica'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Cuál es la primera ley de Newton?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué expresa F = ma?',
       'La fuerza neta sobre un objeto es igual a su masa por su aceleración (2.ª ley de Newton).',
       'fácil', true
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Cinemática y Dinámica'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué expresa F = ma?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Cuál es la ecuación de posición en MRUA?',
       'x = x₀ + v₀t + ½at². Incluye posición inicial, velocidad inicial, tiempo y aceleración.',
       'media', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Cinemática y Dinámica'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Cuál es la ecuación de posición en MRUA?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué es el momento lineal?',
       'p = mv. Producto de la masa por la velocidad de un objeto.',
       'media', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Cinemática y Dinámica'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué es el momento lineal?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué establece la ley de conservación de energía?',
       'La energía total de un sistema aislado permanece constante; solo se transforma.',
       'difícil', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Cinemática y Dinámica'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué establece la ley de conservación de energía?');

-- Mazo: Administración de Proyectos  (0 completadas, 5 pendientes)

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Cuáles son las 5 fases del ciclo de vida PMI?',
       'Inicio, Planificación, Ejecución, Monitoreo/Control y Cierre.',
       'media', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Administración de Proyectos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Cuáles son las 5 fases del ciclo de vida PMI?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué es un sprint en Scrum?',
       'Iteración de duración fija (1-4 semanas) en la que el equipo entrega un incremento funcional.',
       'fácil', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Administración de Proyectos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué es un sprint en Scrum?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Para qué sirve la matriz RACI?',
       'Define roles en un proyecto: Responsable, Aprobador, Consultado e Informado por tarea.',
       'media', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Administración de Proyectos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Para qué sirve la matriz RACI?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué mide el índice de desempeño del costo (CPI)?',
       'CPI = EV / AC. Mide la eficiencia del presupuesto; >1 es favorable.',
       'difícil', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Administración de Proyectos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué mide el índice de desempeño del costo (CPI)?');

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado)
SELECT m.mazo_id,
       '¿Qué es un diagrama de Gantt?',
       'Gráfica de barras que muestra tareas vs. tiempo, útil para visualizar el cronograma.',
       'fácil', false
FROM mazo m JOIN usuario u ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Administración de Proyectos'
AND NOT EXISTS (SELECT 1 FROM tarjetas t WHERE t.mazo_id = m.mazo_id AND t.frente = '¿Qué es un diagrama de Gantt?');

-- ── Sesiones de estudio (semana actual, días Lun–Vie) ─────
-- DATE_TRUNC('week', NOW()) = lunes de la semana en curso

-- Lunes: 2 h en Cálculo Integral  (8 aciertos / 2 errores)
INSERT INTO sesion_estudio (user_id, mazo_id, fecha_inicio, fecha_fin, aciertos, errores)
SELECT u.user_id, m.mazo_id,
       DATE_TRUNC('week', NOW()) + INTERVAL '9 hours',
       DATE_TRUNC('week', NOW()) + INTERVAL '11 hours',
       8, 2
FROM usuario u JOIN mazo m ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Antiderivadas e Integrales'
AND NOT EXISTS (
  SELECT 1 FROM sesion_estudio s
  WHERE s.user_id = u.user_id
    AND s.fecha_inicio = DATE_TRUNC('week', NOW()) + INTERVAL '9 hours'
);

-- Martes: 1.5 h en Programación  (6 aciertos / 4 errores)
INSERT INTO sesion_estudio (user_id, mazo_id, fecha_inicio, fecha_fin, aciertos, errores)
SELECT u.user_id, m.mazo_id,
       DATE_TRUNC('week', NOW()) + INTERVAL '1 day 10 hours',
       DATE_TRUNC('week', NOW()) + INTERVAL '1 day 11 hours 30 minutes',
       6, 4
FROM usuario u JOIN mazo m ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Estructuras de Datos'
AND NOT EXISTS (
  SELECT 1 FROM sesion_estudio s
  WHERE s.user_id = u.user_id
    AND s.fecha_inicio = DATE_TRUNC('week', NOW()) + INTERVAL '1 day 10 hours'
);

-- Miércoles: 3 h en Cálculo Integral  (12 aciertos / 3 errores)
INSERT INTO sesion_estudio (user_id, mazo_id, fecha_inicio, fecha_fin, aciertos, errores)
SELECT u.user_id, m.mazo_id,
       DATE_TRUNC('week', NOW()) + INTERVAL '2 days 8 hours',
       DATE_TRUNC('week', NOW()) + INTERVAL '2 days 11 hours',
       12, 3
FROM usuario u JOIN mazo m ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Antiderivadas e Integrales'
AND NOT EXISTS (
  SELECT 1 FROM sesion_estudio s
  WHERE s.user_id = u.user_id
    AND s.fecha_inicio = DATE_TRUNC('week', NOW()) + INTERVAL '2 days 8 hours'
);

-- Jueves: 2 h en Física  (7 aciertos / 3 errores)
INSERT INTO sesion_estudio (user_id, mazo_id, fecha_inicio, fecha_fin, aciertos, errores)
SELECT u.user_id, m.mazo_id,
       DATE_TRUNC('week', NOW()) + INTERVAL '3 days 9 hours',
       DATE_TRUNC('week', NOW()) + INTERVAL '3 days 11 hours',
       7, 3
FROM usuario u JOIN mazo m ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Cinemática y Dinámica'
AND NOT EXISTS (
  SELECT 1 FROM sesion_estudio s
  WHERE s.user_id = u.user_id
    AND s.fecha_inicio = DATE_TRUNC('week', NOW()) + INTERVAL '3 days 9 hours'
);

-- Jueves: 1 h en Gestión  (4 aciertos / 6 errores)
INSERT INTO sesion_estudio (user_id, mazo_id, fecha_inicio, fecha_fin, aciertos, errores)
SELECT u.user_id, m.mazo_id,
       DATE_TRUNC('week', NOW()) + INTERVAL '3 days 15 hours',
       DATE_TRUNC('week', NOW()) + INTERVAL '3 days 16 hours',
       4, 6
FROM usuario u JOIN mazo m ON m.user_id = u.user_id
WHERE u.correo = 'admin@corestudy.com' AND m.titulo = 'Administración de Proyectos'
AND NOT EXISTS (
  SELECT 1 FROM sesion_estudio s
  WHERE s.user_id = u.user_id
    AND s.fecha_inicio = DATE_TRUNC('week', NOW()) + INTERVAL '3 days 15 hours'
);

--
-- PostgreSQL database dump complete
--

\unrestrict agUKsGdG7IQRSLT3iRGLBIXz0iLJgyTNgYMWRGROhIXxMiFVHEaIsYj6vds9K8q

