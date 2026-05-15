-- ============================================================
--  EduBrain AI — Migración completa para Neon PostgreSQL
--  Incluye: esquema + usuario demo + mazos de ejemplo
-- ============================================================

-- ── Tablas ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuario (
  user_id    SERIAL PRIMARY KEY,
  nombre     VARCHAR(100)  NOT NULL,
  correo     VARCHAR(150)  NOT NULL UNIQUE,
  contrasena VARCHAR(255)  NOT NULL,
  rol        VARCHAR(20)   NOT NULL DEFAULT 'estudiante'
);

CREATE TABLE IF NOT EXISTS mazo (
  mazo_id        SERIAL PRIMARY KEY,
  user_id        INTEGER       NOT NULL REFERENCES usuario(user_id) ON DELETE CASCADE,
  materia        VARCHAR(100),
  titulo         VARCHAR(200)  NOT NULL,
  descripcion    TEXT,
  fecha_creacion TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tarjetas (
  tarjeta_id SERIAL PRIMARY KEY,
  mazo_id    INTEGER  NOT NULL REFERENCES mazo(mazo_id) ON DELETE CASCADE,
  frente     TEXT     NOT NULL,
  verso      TEXT     NOT NULL,
  dificultad VARCHAR(50),
  completado BOOLEAN  NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS sesion_estudio (
  sesion_id   SERIAL PRIMARY KEY,
  user_id     INTEGER   NOT NULL REFERENCES usuario(user_id) ON DELETE CASCADE,
  mazo_id     INTEGER   NOT NULL REFERENCES mazo(mazo_id)   ON DELETE CASCADE,
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin    TIMESTAMP,
  aciertos    INTEGER   NOT NULL DEFAULT 0,
  errores     INTEGER   NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS archivo (
  archivo_id   SERIAL PRIMARY KEY,
  mazo_id      INTEGER       NOT NULL REFERENCES mazo(mazo_id)    ON DELETE CASCADE,
  user_id      INTEGER       NOT NULL REFERENCES usuario(user_id) ON DELETE CASCADE,
  nombre       VARCHAR(200)  NOT NULL,
  materia      VARCHAR(100),
  tipo_archivo VARCHAR(50),
  ruta         TEXT          NOT NULL
);

-- ── Usuario demo (admin) ──────────────────────────────────────
-- Contraseña: Admin#2026

INSERT INTO usuario (user_id, nombre, correo, contrasena, rol) VALUES
  (1, 'Administrador', 'admin@corestudy.com',
   '$2b$12$GTDPILRSH57/d5QJZcmJOePtdFTqYqnjfw8P26jPo0cysV45u1XpG', 'admin')
ON CONFLICT (correo) DO NOTHING;

-- Ajustar secuencia después de insertar con ID fijo
SELECT setval('usuario_user_id_seq', (SELECT MAX(user_id) FROM usuario));

-- ── Mazos de ejemplo (del usuario admin) ─────────────────────

INSERT INTO mazo (mazo_id, user_id, materia, titulo, descripcion, fecha_creacion) VALUES
  (1, 1, 'Cálculo Integral',   'Antiderivadas e Integrales',   'Repaso de métodos de integración indefinida',   '2026-04-09 21:55:10'),
  (2, 1, 'Programación',       'Estructuras de Datos',         'Pilas, colas, listas enlazadas y árboles',      '2026-04-13 21:55:10'),
  (3, 1, 'Física',             'Cinemática y Dinámica',        'Movimiento, fuerzas y leyes de Newton',         '2026-04-16 21:55:10'),
  (4, 1, 'Gestión',            'Administración de Proyectos',  'PMI, Scrum, Kanban y gestión de riesgos',       '2026-04-20 21:55:10')
ON CONFLICT DO NOTHING;

SELECT setval('mazo_mazo_id_seq', (SELECT MAX(mazo_id) FROM mazo));

-- ── Tarjetas ──────────────────────────────────────────────────

INSERT INTO tarjetas (mazo_id, frente, verso, dificultad, completado) VALUES
  -- Cálculo Integral
  (1, '¿Qué es una antiderivada?',                      'Es una función F(x) cuya derivada es la función original f(x).',                                  'fácil',   false),
  (1, '¿Cómo integras x^n cuando n ≠ −1?',             'Sumas 1 al exponente y divides entre ese nuevo valor: x^(n+1)/(n+1) + C.',                         'fácil',   false),
  (1, '¿Por qué se agrega +C en una integral indefinida?','Porque al derivar una constante se obtiene 0; existen infinitas antiderivadas.',                  'media',   false),
  (1, '¿Cómo verificas una antiderivada?',              'Deriva tu resultado. Si recuperas la función original, la antiderivada es correcta.',               'fácil',   false),
  (1, '¿Cuándo conviene usar sustitución?',             'Cuando parte de la expresión puede convertirse en nueva variable para simplificar.',                'media',   false),
  (1, '¿Cuándo usar sustitución trigonométrica?',       'Cuando el integrando contiene √(a²−x²), √(a²+x²) o √(x²−a²).',                                   'difícil', false),
  (1, '¿Fórmula de integración por partes?',            '∫u dv = uv − ∫v du. Se elige u como la función más fácil de derivar.',                            'difícil', false),
  -- Estructuras de datos
  (2, '¿Qué es una pila (stack)?',                     'Estructura LIFO: el último en entrar es el primero en salir.',                                      'fácil',   false),
  (2, '¿Qué es una cola (queue)?',                     'Estructura FIFO: el primero en entrar es el primero en salir.',                                     'fácil',   false),
  (2, '¿Complejidad de búsqueda en BST balanceado?',   'O(log n) en promedio para búsqueda, inserción y eliminación.',                                      'media',   false),
  (2, '¿Diferencia entre lista simple y doble?',       'La simple tiene puntero al siguiente; la doble tiene punteros al siguiente y al anterior.',          'media',   false),
  (2, '¿Qué es un grafo dirigido?',                    'Grafo donde las aristas tienen dirección (origen → destino), también llamado dígrafo.',              'difícil', false),
  -- Física
  (3, '¿Cuál es la primera ley de Newton?',            'Un objeto en reposo o en movimiento uniforme permanece así a menos que actúe fuerza neta.',         'fácil',   false),
  (3, '¿Qué expresa F = ma?',                          'La fuerza neta es igual a la masa por la aceleración (2.ª ley de Newton).',                         'fácil',   false),
  (3, '¿Ecuación de posición en MRUA?',                'x = x₀ + v₀t + ½at². Incluye posición inicial, velocidad inicial, tiempo y aceleración.',           'media',   false),
  (3, '¿Qué es el momento lineal?',                    'p = mv. Producto de la masa por la velocidad del objeto.',                                           'media',   false),
  (3, '¿Qué establece la conservación de energía?',    'La energía total de un sistema aislado permanece constante; solo se transforma.',                   'difícil', false),
  -- Gestión
  (4, '¿Cuáles son las 5 fases del ciclo PMI?',        'Inicio, Planificación, Ejecución, Monitoreo/Control y Cierre.',                                     'media',   false),
  (4, '¿Qué es un sprint en Scrum?',                   'Iteración de duración fija (1-4 semanas) que entrega un incremento funcional.',                     'fácil',   false),
  (4, '¿Para qué sirve la matriz RACI?',               'Define roles: Responsable, Aprobador, Consultado e Informado por tarea.',                           'media',   false),
  (4, '¿Qué mide el índice CPI?',                      'CPI = EV / AC. Mide eficiencia del presupuesto; >1 es favorable.',                                  'difícil', false),
  (4, '¿Qué es un diagrama de Gantt?',                 'Gráfica de barras que muestra tareas vs. tiempo para visualizar el cronograma.',                    'fácil',   false);
