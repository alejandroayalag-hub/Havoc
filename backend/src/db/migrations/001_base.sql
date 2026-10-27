

CREATE TABLE public.checadas (
    id integer NOT NULL,
    empleado_id integer NOT NULL,
    dispositivo_id integer NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    tipo character varying(10) DEFAULT 'entrada'::character varying NOT NULL,
    uid_checador integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT checadas_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['entrada'::character varying, 'salida'::character varying, 'desconocido'::character varying])::text[])))
);

CREATE SEQUENCE public.checadas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.checadas_id_seq OWNED BY public.checadas.id;

CREATE TABLE public.checador_dispositivos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    ubicacion character varying(150),
    ip character varying(45),
    api_key character varying(64) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.checador_dispositivos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.checador_dispositivos_id_seq OWNED BY public.checador_dispositivos.id;

CREATE TABLE public.checador_empleados (
    id integer NOT NULL,
    empleado_id integer NOT NULL,
    dispositivo_id integer NOT NULL,
    uid_checador integer NOT NULL
);

CREATE SEQUENCE public.checador_empleados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.checador_empleados_id_seq OWNED BY public.checador_empleados.id;

CREATE TABLE public.documentos (
    id integer NOT NULL,
    empleado_id integer NOT NULL,
    tipo_documento_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    ruta character varying(500) NOT NULL,
    estatus character varying(20) DEFAULT 'completo'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT documentos_estatus_check CHECK (((estatus)::text = ANY ((ARRAY['completo'::character varying, 'pendiente'::character varying, 'vencido'::character varying])::text[])))
);

CREATE SEQUENCE public.documentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.documentos_id_seq OWNED BY public.documentos.id;

CREATE TABLE public.empleados (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido_paterno character varying(100) NOT NULL,
    apellido_materno character varying(100),
    curp character(18),
    rfc character varying(13),
    fecha_nacimiento date,
    fecha_ingreso date DEFAULT CURRENT_DATE NOT NULL,
    puesto character varying(100),
    departamento character varying(100),
    telefono character varying(20),
    email character varying(150),
    direccion text,
    nombre_beneficiario character varying(200),
    foto character varying(500),
    observaciones text,
    estatus character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    contacto_emergencia_nombre text,
    contacto_emergencia_telefono character varying(20),
    CONSTRAINT empleados_estatus_check CHECK (((estatus)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying, 'baja'::character varying])::text[])))
);

CREATE SEQUENCE public.empleados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.empleados_id_seq OWNED BY public.empleados.id;

CREATE TABLE public.pagos (
    id integer NOT NULL,
    semana_pago_id integer NOT NULL,
    empleado_id integer,
    nombre_pdf character varying(200) NOT NULL,
    cuenta character varying(50),
    monto numeric(12,2),
    autorizado character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;

CREATE TABLE public.semanas_pago (
    id integer NOT NULL,
    semana integer NOT NULL,
    anio integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    filename character varying(255) NOT NULL,
    ruta character varying(500) NOT NULL,
    total_registros integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.semanas_pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.semanas_pago_id_seq OWNED BY public.semanas_pago.id;

CREATE TABLE public.tipos_documento (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    requerido boolean DEFAULT true NOT NULL,
    formato_ruta text
);

CREATE SEQUENCE public.tipos_documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.tipos_documento_id_seq OWNED BY public.tipos_documento.id;

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    nombre character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    rol character varying(20) DEFAULT 'admin'::character varying NOT NULL,
    debe_cambiar_password boolean DEFAULT false,
    empleado_id integer,
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['admin'::character varying, 'usuario'::character varying])::text[])))
);

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;

ALTER TABLE ONLY public.checadas ALTER COLUMN id SET DEFAULT nextval('public.checadas_id_seq'::regclass);

ALTER TABLE ONLY public.checador_dispositivos ALTER COLUMN id SET DEFAULT nextval('public.checador_dispositivos_id_seq'::regclass);

ALTER TABLE ONLY public.checador_empleados ALTER COLUMN id SET DEFAULT nextval('public.checador_empleados_id_seq'::regclass);

ALTER TABLE ONLY public.documentos ALTER COLUMN id SET DEFAULT nextval('public.documentos_id_seq'::regclass);

ALTER TABLE ONLY public.empleados ALTER COLUMN id SET DEFAULT nextval('public.empleados_id_seq'::regclass);

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);

ALTER TABLE ONLY public.semanas_pago ALTER COLUMN id SET DEFAULT nextval('public.semanas_pago_id_seq'::regclass);

ALTER TABLE ONLY public.tipos_documento ALTER COLUMN id SET DEFAULT nextval('public.tipos_documento_id_seq'::regclass);

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);

ALTER TABLE ONLY public.checadas
    ADD CONSTRAINT checadas_dispositivo_id_uid_checador_timestamp_key UNIQUE (dispositivo_id, uid_checador, "timestamp");

ALTER TABLE ONLY public.checadas
    ADD CONSTRAINT checadas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.checador_dispositivos
    ADD CONSTRAINT checador_dispositivos_api_key_key UNIQUE (api_key);

ALTER TABLE ONLY public.checador_dispositivos
    ADD CONSTRAINT checador_dispositivos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.checador_empleados
    ADD CONSTRAINT checador_empleados_dispositivo_id_uid_checador_key UNIQUE (dispositivo_id, uid_checador);

ALTER TABLE ONLY public.checador_empleados
    ADD CONSTRAINT checador_empleados_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_empleado_id_tipo_documento_id_key UNIQUE (empleado_id, tipo_documento_id);

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_curp_key UNIQUE (curp);

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_rfc_key UNIQUE (rfc);

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.semanas_pago
    ADD CONSTRAINT semanas_pago_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.semanas_pago
    ADD CONSTRAINT semanas_pago_semana_anio_key UNIQUE (semana, anio);

ALTER TABLE ONLY public.tipos_documento
    ADD CONSTRAINT tipos_documento_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.tipos_documento
    ADD CONSTRAINT tipos_documento_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);

CREATE INDEX idx_checadas_empleado ON public.checadas USING btree (empleado_id);

CREATE INDEX idx_checadas_timestamp ON public.checadas USING btree ("timestamp");

CREATE UNIQUE INDEX usuarios_empleado_unico ON public.usuarios USING btree (empleado_id) WHERE (empleado_id IS NOT NULL);

ALTER TABLE ONLY public.checadas
    ADD CONSTRAINT checadas_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.checador_dispositivos(id);

ALTER TABLE ONLY public.checadas
    ADD CONSTRAINT checadas_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.checador_empleados
    ADD CONSTRAINT checador_empleados_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.checador_dispositivos(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.checador_empleados
    ADD CONSTRAINT checador_empleados_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_tipo_documento_id_fkey FOREIGN KEY (tipo_documento_id) REFERENCES public.tipos_documento(id);

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_semana_pago_id_fkey FOREIGN KEY (semana_pago_id) REFERENCES public.semanas_pago(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE SET NULL;


INSERT INTO public.tipos_documento VALUES (1, 'Contrato de trabajo', true, NULL);
INSERT INTO public.tipos_documento VALUES (2, 'Solicitud de empleo con fotografía', true, NULL);
INSERT INTO public.tipos_documento VALUES (3, 'Copia de acta de nacimiento', true, NULL);
INSERT INTO public.tipos_documento VALUES (4, 'Copia de identificación', true, NULL);
INSERT INTO public.tipos_documento VALUES (5, 'Copia de comprobante de domicilio (menor a 90 días de la contratación)', true, NULL);
INSERT INTO public.tipos_documento VALUES (6, 'Número de seguridad social', true, NULL);
INSERT INTO public.tipos_documento VALUES (7, 'Constancia de RFC reciente', true, NULL);
INSERT INTO public.tipos_documento VALUES (8, 'Certificado médico (sin enfermedad contagiosa ni padecimientos de columna)', true, NULL);
INSERT INTO public.tipos_documento VALUES (9, 'Comprobante de estudios', false, NULL);
INSERT INTO public.tipos_documento VALUES (10, 'Tarjeta de nómina BBVA', true, NULL);
INSERT INTO public.tipos_documento VALUES (11, 'Convenio de horario', true, NULL);
INSERT INTO public.tipos_documento VALUES (12, 'Convenio de pago electrónico', true, NULL);
INSERT INTO public.tipos_documento VALUES (13, 'Resguardos por parte de la empresa', false, NULL);
INSERT INTO public.tipos_documento VALUES (14, 'Aviso de privacidad', true, NULL);
INSERT INTO public.tipos_documento VALUES (15, 'Adhesión al sindicato', true, NULL);
INSERT INTO public.tipos_documento VALUES (16, 'Reglamento interior', true, NULL);
INSERT INTO public.tipos_documento VALUES (17, 'Aviso de crédito al Infonavit', false, NULL);
SELECT pg_catalog.setval('public.tipos_documento_id_seq', 17, true);
