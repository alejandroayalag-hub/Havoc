# HAVOC Control — Diseño

Fecha: 2026-10-22 · Autor: Alejandro Ayala (con Claude)

## 1. Qué es y por qué

HAVOC — Soluciones Integradas es la empresa de software de Alejandro y Liliana Flores
(Uruapan). Hoy no tiene ningún sistema interno: solo la landing havocdev.mx. La empresa
está en trámites de alta ante gobierno; al quedar formal, toca cobrar en serio lo que
hasta ahora se cobró de forma simbólica.

**HAVOC Control** es la plataforma interna para operar la empresa, con la misma forma y
stack que la plataforma de Gioval (Elys).

### Modelo de negocio (lo que la plataforma debe reflejar)
- Los clientes llegan por recomendación, con un problema concreto (personal, rondines,
  escuela, clínica…). El origen es la experiencia en ATA.
- Cobro en dos partes: **pago único por desarrollo** + **mensualidad** por hosting y
  mantenimiento de sus datos en el servidor.
- Entregable: acceso a su plataforma + manuales de usuario + capacitación.
- HAVOC ya tiene un portafolio de sistemas construidos (RHATA, BioChek, Rondines,
  Expediente MX, GESSI, Gioval, POS…) que se pueden revender como módulos.

### Usuarios
Alejandro y Liliana Flores. Se contempla contratar más personal pronto.

### Prioridad del usuario
Si solo hubiera uno o dos módulos: **Leads de venta** y **Catálogo de módulos**.

## 2. Objetivos
1. Que ningún lead ni necesidad escuchada en una plática se pierda.
2. Cotizar rápido a un lead usando el catálogo de lo ya construido.
3. Saber en todo momento qué cliente tiene qué sistema, cuánto paga y si está al corriente.
4. Ver ingresos, gastos y ganancia real por mes y por cliente.
5. Tener a la mano el material para mandar a un lead (logos, presentaciones, demos).

## 3. No-objetivos (por ahora)
- Facturación CFDI → fase posterior, cuando la empresa esté dada de alta.
- Portal para clientes (que el cliente entre a ver su saldo) — no se pidió.
- App móvil — no se pidió.
- Monitoreo de servidores/uptime — no se pidió.

## 4. Anti-objetivos (sería un fracaso aunque funcione)
- **Guardar contraseñas de clientes o servidores en la plataforma.** Las credenciales
  siguen fuera (anexo separado), la plataforma solo guarda URL/servidor/puerto/repo.
- Que capturar un lead tome más tiempo que anotarlo en WhatsApp. El alta rápida debe ser
  nombre + teléfono + "qué necesita".
- Arrastrar módulos clínicos/farmacia de Gioval que no aplican a HAVOC.

## 5. Módulos

### 5.1 Personal (base RHATA/Elys completa)
Empleados, expediente, documentos, contratos, pagos/nómina, checador — tal como existe en
la base. El usuario lo pidió completo ("todo, expedientes y todo"). Usuarios y roles salen
de aquí.

### 5.2 Leads de venta ⭐ prioridad
- Alta rápida: nombre, teléfono, empresa (opcional), quién lo recomendó, **qué necesita**
  (texto libre).
- Etapas: Nuevo → Reunión → Cotización enviada → Ganado / Perdido (con motivo).
- Desde la ficha del lead: agendar reunión (va a Agenda), anotar necesidades (van a
  Ideas, ligadas al lead), armar cotización y ver qué material de marketing mandarle.
- **Cotización:** se arma eligiendo módulos del Catálogo; cada línea trae precio de
  desarrollo + mensualidad sugeridos (editables). Se imprime/guarda como PDF con marca HAVOC.
- **Ganado → se convierte en Cliente** con sus módulos contratados ya cargados.

### 5.3 Catálogo de módulos ⭐ prioridad
Vitrina interna de lo ya construido.
- Por módulo: nombre, descripción corta, para quién sirve, funciones principales,
  precio de desarrollo sugerido, mensualidad sugerida, estado (Listo para vender /
  Existe en un proyecto pero sin empaquetar), proyecto de origen.
- Ver qué clientes lo usan ya.
- Material de marketing ligado (demo, presentación).
- Carga inicial (precios en blanco, los pone el usuario): RHATA (RH), BioChek (checador
  biométrico), Rondines (QR+GPS), Expediente MX, GESSI (seguridad), Clínica (Gioval),
  POS / Punto de venta (Gioval, sin empaquetar), Control escolar (Gokids/Educare),
  Agrícola (Mi Huerta), HVAC campo (Pedraza), Bitácora automotriz (AutoFix),
  Landing/sitio web.

### 5.4 Clientes
- Ficha: datos de contacto, razón social/RFC (para CFDI futuro), origen (lead ganado).
- **Sistemas instalados** por cliente: qué módulo(s), URL/dominio, servidor, repo,
  fecha de entrega, si ya recibió manual y capacitación, mensualidad acordada.
- Saldo: lo que debe de desarrollo y de mensualidades.
- Carga inicial con los clientes actuales (ATA, Gioval, Pedraza, KERAGROmel, Diandra,
  GESSI, Gokids, Educare, Mi Huerta, AutoFix…); montos los captura el usuario.

### 5.5 Agenda
- Tipos de evento: **Reunión, Entrega, Capacitación, Cobro**.
- Vista día/semana/mes (base: Citas de Elys).
- Ligado a lead o cliente.
- Cobros de mensualidades se generan solos en la agenda según la fecha de corte de cada
  cliente.
- **Sincronización con Google Calendar** (reutilizar el servicio de Elys). HAVOC usa
  correo Namecheap, no Google Workspace → la sync va a una cuenta Google por definir.

### 5.6 Finanzas
- **Ingresos:** pagos de desarrollo (anticipo/parcialidades) y mensualidades, por cliente.
- **Mensualidades recurrentes:** cada mes se genera el cargo; se marca pagado/pendiente;
  vista "quién debe".
- **Gastos:** servidores (Hetzner), dominios, Namecheap, licencias, cuentas de
  desarrollador Apple/Google, etc. Opcionalmente asignados a un cliente.
- **Reportes:** ingreso, gasto y ganancia por mes y por cliente.
- CFDI: fase posterior (fuera de este diseño).

### 5.7 Ideas de módulos nuevos
No es lluvia de ideas abstracta: es capturar **necesidades que se escuchan al cliente**
en la plática (ej. "necesita punto de venta").
- Captura: texto, ligada a lead/cliente que la pidió, cuántos la han pedido.
- Marcar si **ya existe en algún proyecto** (ej. POS en Gioval) aunque no esté empaquetado.
- Estado: Nueva → En evaluación → Empaquetar → **Pasa al Catálogo** / Descartada.

### 5.8 Material de marketing
- Biblioteca de: logos, presentaciones, videos demo (y lo que se agregue).
- Se puede ligar a un módulo del catálogo.
- Desde la ficha de un lead se ve el material de los módulos que le interesan, listo para
  mandar.
- Carga inicial: los 4 logos SVG oficiales de `~/havoc-landing/assets/`.

## 6. Cómo se construye (decisiones)

**Decidido por el usuario:**
- Que sea "como la de Gioval".
- Google Calendar sí.
- CFDI después.

**Decisión mía (revisar):**
- **Fork de Elys (Gioval)**, borrando lo clínico (pacientes, historias clínicas, farmacia,
  consentimientos, tratamientos, laboratorios, insumos, agenda en línea pública). Se
  conserva: auth/usuarios/roles, empleados y todo RH, citas→agenda, sync Google Calendar,
  finanzas. Stack: Node/Express + PostgreSQL (Docker) + React/Vite, PM2 + Nginx.
- Carpeta `~/havoc-control/`, puertos **3019** (backend), **5448** (PostgreSQL),
  **8102** (Nginx). Servidor Hetzner 62.238.3.136. Dominio `control.havocdev.mx` con HTTPS.
- Marca HAVOC: ciruela `#1E1533`, violeta `#8B5CF6` (nunca fondo dominante), violeta
  profundo `#5B21B6`; Space Grotesk / Inter / IBM Plex Mono.
- Roles iniciales: Alejandro y Liliana ambos admin.
- Repo GitHub `havoc-control` (llave de cuenta SSH).

## 7. Fases
1. **Base + Leads + Catálogo** — fork limpio, marca HAVOC, Personal, Leads con
   cotización, Catálogo con carga inicial. *(lo que el usuario necesita primero)*
2. **Clientes + Finanzas** — sistemas instalados, mensualidades recurrentes, gastos, reportes.
3. **Agenda + Google Calendar.**
4. **Ideas + Material de marketing.**
5. **CFDI** (cuando exista la empresa) — diseño aparte.

Deploy a producción al cerrar cada fase.

## 8. Queda a criterio del constructor
- Esquema de tablas y nombres de rutas.
- Material de marketing: subir archivo al servidor o pegar liga (YouTube/Drive) para
  videos pesados — ambos sirven.
- PDF de cotización: impresión del navegador vs. generador del backend (lo que ya use
  la base para contratos).
- Día de corte de mensualidad por cliente (default: día de entrega).
