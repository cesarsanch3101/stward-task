# Manual de Usuario — Stward Task
**Versión:** 1.3 · **Idioma:** Español · **Fecha:** Febrero 2026

---

## Índice

1. [Introducción](#1-introducción)
2. [Acceso al sistema](#2-acceso-al-sistema)
3. [Espacios de trabajo](#3-espacios-de-trabajo)
   - 3.5 [Dashboard & Gantt del workspace](#35-dashboard--gantt-del-workspace)
4. [Tableros](#4-tableros)
5. [Vista Kanban](#5-vista-kanban)
6. [Vista Tabla](#6-vista-tabla)
7. [Vista Dashboard](#7-vista-dashboard)
8. [Vista Gantt](#8-vista-gantt)
9. [Gestión de tareas](#9-gestión-de-tareas)
10. [Colaboradores y asignaciones](#10-colaboradores-y-asignaciones)
11. [Comentarios](#11-comentarios)
12. [Notificaciones](#12-notificaciones)
13. [Ajustes de interfaz](#13-ajustes-de-interfaz)
14. [Comportamiento automático del sistema](#14-comportamiento-automático-del-sistema)
15. [Visibilidad de tareas por rol](#15-visibilidad-de-tareas-por-rol)
16. [Preguntas frecuentes](#16-preguntas-frecuentes)

---

## 1. Introducción

**Stward Task** es una aplicación de gestión de proyectos basada en tableros Kanban. Permite a equipos organizar su trabajo en columnas, asignar tareas, dar seguimiento al progreso y colaborar mediante comentarios y notificaciones.

### ¿Qué puedes hacer con Stward Task?

| Función | Descripción |
|---------|-------------|
| Kanban | Organiza tareas en columnas de estado con arrastrar y soltar |
| Tabla | Visualiza todas las tareas en formato de lista |
| Dashboard | Estadísticas y gráficas del estado del proyecto (por tablero) |
| Gantt | Línea de tiempo de tareas con fechas de inicio y fin (por tablero) |
| Dashboard Workspace | KPIs globales y resumen de todos los tableros del workspace |
| Gantt Workspace | Línea de tiempo unificada agrupada por tablero |
| Colaboración | Asigna múltiples personas a cada tarea con progreso individual |
| Comentarios | Discute el avance directamente en cada tarea |
| Notificaciones | Recibe alertas cuando cambia algo que te involucra |
| Correo | Envía y recibe actualizaciones por email |

---

## 2. Acceso al sistema

### 2.1 Iniciar sesión

1. Abre el navegador y ve a `http://localhost:3000` (o la URL de tu instancia)
2. En la pantalla de inicio de sesión, ingresa:
   - **Correo electrónico**
   - **Contraseña** (mínimo 8 caracteres)
3. Haz clic en **"Iniciar sesión"**
4. Serás redirigido automáticamente al primer tablero disponible

> **Cuenta demo:** `admin@stwards.com` / `admin123`

### 2.2 Crear una cuenta

1. En la pantalla de inicio de sesión, haz clic en **"¿No tienes cuenta? Regístrate"**
2. Completa el formulario:

   | Campo | Obligatorio | Descripción |
   |-------|-------------|-------------|
   | Nombre | No | Tu nombre |
   | Apellido | No | Tu apellido |
   | Correo electrónico | Sí | Identificador único en el sistema |
   | Contraseña | Sí | Mínimo 8 caracteres |

3. Haz clic en **"Crear cuenta"**
4. Quedarás conectado automáticamente

### 2.3 Sesión y seguridad

- La sesión se renueva automáticamente cada 30 minutos
- Si tu sesión expira, el sistema redirige al inicio de sesión
- Los tokens de refresco duran 7 días
- No es necesario volver a iniciar sesión si usas la aplicación con regularidad

---

## 3. Espacios de trabajo

Un **espacio de trabajo** (workspace) es el contenedor de más alto nivel. Dentro de él se crean los tableros del equipo.

### 3.1 Ver espacios de trabajo

El panel lateral izquierdo muestra todos tus espacios de trabajo con sus tableros anidados.

### 3.2 Crear un espacio de trabajo

1. En la parte inferior del panel lateral, haz clic en **"+ Nuevo espacio de trabajo"**
2. Completa:
   - **Nombre** — obligatorio
   - **Descripción** — opcional
3. Haz clic en **"Crear"**

### 3.3 Editar un espacio de trabajo

1. Pasa el cursor sobre el nombre del espacio de trabajo en el panel lateral
2. Haz clic en el menú **⋯** (tres puntos)
3. Selecciona **"Editar"**
4. Modifica nombre y/o descripción
5. Haz clic en **"Guardar"**

### 3.4 Eliminar un espacio de trabajo

> ⚠️ **Advertencia:** Eliminar un espacio de trabajo borra permanentemente todos sus tableros, columnas y tareas.

1. Haz clic en el menú **⋯** junto al nombre del espacio de trabajo
2. Selecciona **"Eliminar"**
3. Confirma la acción en el diálogo de alerta

### 3.5 Dashboard & Gantt del workspace

Cada espacio de trabajo tiene una **vista consolidada** que unifica las tareas de todos sus tableros. Es la forma más rápida de ver el estado general de un proyecto complejo con múltiples tableros.

**Cómo acceder:**
Haz clic directamente en el **bloque del nombre del workspace** en el panel lateral (el recuadro con borde redondeado).

**Vistas disponibles:**

| Vista | Qué muestra |
|-------|-------------|
| **Dashboard** | KPIs globales + resumen por tablero + gráficas de estado y prioridad + carga del equipo |
| **Gantt** | Línea de tiempo con todos los tableros como grupos, cada uno con un color distinto |

**Dashboard del workspace:**
- **4 KPIs globales:** Total de tareas, completadas, en progreso y vencidas (sumando todos los tableros)
- **Resumen por tablero:** Cards con nombre del tablero, número de tareas, completadas y progreso promedio. Haz clic en un card para ir al tablero.
- **Distribución por estado:** Gráfica de dona con la cantidad de tareas en cada estado. La leyenda muestra un badge con el conteo exacto por estado (Pendiente, En Progreso, Retrasado, Completado)
- **Carga por prioridad:** Distribución de tareas por nivel de prioridad
- **Carga del equipo:** Tabla con el número de tareas asignadas a cada colaborador

**Gantt del workspace:**
- Muestra una fila de grupo por cada tablero (con su color identificativo)
- Dentro de cada grupo, una barra por tarea con fechas de inicio y fin
- Las barras de tareas vencidas se muestran en rojo
- Mismo sistema de zoom: Días / Semanas / Meses / Ajustar
- La línea vertical azul indica el día de hoy
- El calendario cubre 2 meses atrás + 13 meses adelante

---

## 4. Tableros

Un **tablero** representa un proyecto. Contiene columnas y tareas organizadas en vista Kanban o tabla.

### 4.1 Crear un tablero

1. Haz clic en el menú **⋯** junto al nombre de un espacio de trabajo
2. Selecciona **"Nuevo tablero"**
3. Completa:
   - **Nombre** — obligatorio
   - **Descripción** — opcional
4. Haz clic en **"Crear"**

Al crear un tablero, el sistema genera automáticamente **4 columnas predeterminadas**:

| Columna | Estado semántico |
|---------|-----------------|
| Pendiente | Sin iniciar |
| En Progreso | En curso |
| Retrasado | Con retraso |
| Completado | Finalizado |

Serás redirigido automáticamente al nuevo tablero.

### 4.2 Navegar entre tableros

- Los tableros aparecen listados bajo cada espacio de trabajo en el panel lateral
- Haz clic en el nombre del tablero para abrirlo
- El tablero activo aparece resaltado en el panel lateral

### 4.3 Editar un tablero

1. Haz clic en el menú **⋯** junto al nombre del tablero en el panel lateral
2. Selecciona **"Editar"**
3. Modifica nombre y/o descripción
4. Haz clic en **"Guardar"**

### 4.4 Eliminar un tablero

> ⚠️ **Advertencia:** Eliminar un tablero borra permanentemente todas sus columnas y tareas.

1. Haz clic en el menú **⋯** junto al nombre del tablero
2. Selecciona **"Eliminar"**
3. Confirma la eliminación

---

## 5. Vista Kanban

La vista Kanban es la vista principal. Muestra las tareas organizadas en columnas con la posibilidad de moverlas mediante arrastre.

### 5.1 Estructura del tablero

```
┌─────────────────────────────────────────────────────┐
│  Pendiente (3)    En Progreso (2)   Completado (1)  │
│  ┌────────────┐  ┌────────────┐    ┌────────────┐  │
│  │ Tarea A    │  │ Tarea C    │    │ Tarea F    │  │
│  ├────────────┤  ├────────────┤    └────────────┘  │
│  │ Tarea B    │  │ Tarea D    │                     │
│  ├────────────┤  └────────────┘                     │
│  │ Tarea E    │                                     │
│  └────────────┘                                     │
└─────────────────────────────────────────────────────┘
```

### 5.2 Información en las tarjetas de tarea

Cada tarjeta muestra:

| Elemento | Descripción |
|----------|-------------|
| **Título** | Nombre de la tarea |
| **Prioridad** | Etiqueta de color (sin prioridad, baja, media, alta, urgente) |
| **Avatares** | Foto/iniciales de los colaboradores asignados (máximo 3 visibles) |
| **Fechas** | Rango de fecha inicio — fecha fin (ej: "23 feb - 15 mar") |
| **Progreso** | Barra de avance con porcentaje |
| **Vencida** | Etiqueta roja si la fecha fin ya pasó y el progreso es < 100% |

**Colores de prioridad:**
- Sin prioridad → gris
- Baja → azul
- Media → amarillo
- Alta → naranja
- Urgente → rojo

**Barra de progreso con múltiples colaboradores:**
Si la tarea tiene varios colaboradores asignados, la barra de progreso se divide en segmentos de colores, uno por persona, mostrando el avance individual de cada uno.

### 5.3 Mover tareas (arrastrar y soltar)

1. Haz clic y mantén presionado sobre una tarjeta de tarea
2. Arrastra la tarjeta a otra columna o a otra posición en la misma columna
3. Suelta la tarjeta en la posición deseada

**Indicadores visuales durante el arrastre:**
- La tarjeta se vuelve semitransparente (50% opacidad)
- La columna destino se resalta en azul claro
- Una vista previa sigue al cursor

> **Importante:** Al mover una tarea a otra columna, el progreso se actualiza automáticamente según la posición de la columna. Ver [sección 14.1](#141-progreso-automático-al-mover-tareas).

### 5.4 Navegación por teclado

El tablero soporta accesibilidad por teclado para usuarios de lectores de pantalla y navegación sin mouse:
- Usar **Tab** para navegar entre elementos
- El sistema anuncia en español cada acción de arrastre: "Arrastrando tarea: [título]", "Tarea movida a: [columna]", etc.

### 5.5 Agregar tareas desde una columna

1. Haz clic en el botón **"+"** en el encabezado de la columna
2. Se abre el diálogo "Nueva tarea"
3. Completa los campos y crea la tarea (ver [sección 9](#9-gestión-de-tareas))

---

## 6. Vista Tabla

La vista Tabla muestra todas las tareas del tablero en formato de cuadrícula, agrupadas por columna.

### 6.1 Cambiar a vista Tabla

En el encabezado del tablero, haz clic en el botón **"Tabla"** en el selector de vistas.

### 6.2 Columnas de la tabla

| Columna | Descripción |
|---------|-------------|
| Título | Nombre de la tarea (clic para editar) |
| Estado | Nombre de la columna Kanban donde está la tarea |
| Prioridad | Nivel de prioridad con color |
| Asignado | Nombre(s) de colaborador(es) |
| Inicio | Fecha de inicio |
| Fin | Fecha de finalización |
| Progreso | Porcentaje de avance |
| Acciones | Botones de editar / eliminar |

### 6.3 Interacción

- Haz clic en cualquier fila o en el botón de editar para abrir el diálogo de edición
- Las filas se agrupan por columna Kanban con un encabezado de color

---

## 7. Vista Dashboard

El Dashboard ofrece una visión general del estado del proyecto mediante indicadores y gráficas.

### 7.1 Cambiar a vista Dashboard

En el encabezado del tablero, haz clic en el botón **"Dashboard"**.

### 7.2 Indicadores (KPI)

| Indicador | Descripción |
|-----------|-------------|
| **Total Tareas** | Número total de tareas en el tablero |
| **Completadas** | Cantidad y porcentaje de tareas al 100% de progreso |
| **Progreso Promedio** | Promedio de avance de todas las tareas |
| **Colaboradores** | Número de personas asignadas. Si hay tareas retrasadas, muestra una alerta naranja con el conteo |

### 7.3 Gráficas

**Distribución por Estado (dona)**
Muestra cuántas tareas hay en cada columna del tablero. La leyenda lateral derecha muestra cada estado con su color y un **badge con el número de tareas** en ese estado. El badge es legible en modo claro y oscuro.

**Carga de Trabajo por Prioridad (barras verticales)**
Muestra cuántas tareas existen por nivel de prioridad (solo los niveles con tareas aparecen).

### 7.4 Panel "Carga del Equipo"

Tabla detallada que muestra la situación de cada miembro del equipo en el tablero actual.

| Columna | Descripción |
|---------|-------------|
| **Usuario** | Avatar con color asignado, nombre completo y email. Ícono ⚠ si tiene tareas retrasadas |
| **Tareas** | Total de tareas asignadas |
| **Distribución** | Barra segmentada por estado: gris (pendiente), azul (en progreso), naranja (retrasado), verde (completado) |
| **Prog.** | Promedio del progreso individual reportado. Verde ≥75%, azul ≥40%, naranja si hay retrasos |

**Cómo leer la barra de distribución:**
```
[████░░░██████░░░░░░░░░░░████████████████████]
  2P    3EP      1R              2C
Pendiente / En Progreso / Retrasado / Completado
```

- Las tareas con estado **Retrasado** aparecen resaltadas en naranja
- El porcentaje de progreso usa el valor individual de cada asignación (`individual_progress`)
- Si un usuario solo aparece como nombre externo (sin cuenta), se muestra igual en la tabla

### 7.5 Exportar datos desde el Dashboard

En la esquina superior derecha del Dashboard (tablero o workspace) hay dos botones:

| Botón | Qué hace |
|-------|----------|
| **Exportar CSV** | Descarga un archivo `.csv` con todas las tareas visibles. Compatible con Excel (incluye codificación UTF-8 para caracteres en español). Columnas: Título, Estado, Prioridad, Asignado, Fecha inicio, Fecha fin, Progreso |
| **Exportar PDF** | Abre el diálogo de impresión del navegador. El sidebar y los botones se ocultan automáticamente para que el PDF quede limpio |

> **Tip para PDF:** En el diálogo de impresión, selecciona "Guardar como PDF" en el destino para guardar el archivo sin imprimir.

---

## 8. Vista Gantt

La vista Gantt muestra una línea de tiempo de las tareas según sus fechas de inicio y fin.

### 8.1 Cambiar a vista Gantt

En el encabezado del tablero, haz clic en el botón **"Gantt"**.

> **Nota:** Las tareas sin fecha de inicio o fin no aparecen en la línea de tiempo, pero sí en la lista izquierda.

### 8.2 Estructura del Gantt

```
┌──────────────────┬────────────────────────────────────────┐
│ Lista de tareas  │         Línea de tiempo                │
│                  │  ene  │  feb  │  mar  │  abr           │
│ ▼ En Progreso   │       ├───────┤                        │
│   Tarea A        │       │██████│                        │
│   Tarea B        │  ├────────────┤                       │
│ ▼ Pendiente     │                                        │
│   Tarea C        │              ├───────────┤            │
└──────────────────┴────────────────────────────────────────┘
```

### 8.3 Zoom de la línea de tiempo

Usa los controles de zoom en la barra superior:

| Opción | Resolución | Uso recomendado |
|--------|-----------|-----------------|
| **Días** | Alta | Proyectos de corto plazo (semanas) |
| **Semanas** | Media | Proyectos de 1-3 meses |
| **Meses** | Baja | Proyectos de largo plazo |
| **Ajustar** | Automática | Adapta al ancho de pantalla |

### 8.4 Elementos visuales

- **Línea roja vertical:** Indica la fecha de hoy
- **Barra de tarea:** Posicionada entre fecha inicio y fecha fin, coloreada según la columna
- **Porcentaje en barra:** Muestra el progreso actual de la tarea
- **Relleno de progreso:** La barra tiene un overlay semitransparente proporcional al avance

### 8.5 Grupos y expansión

- Las tareas se agrupan por columna Kanban
- Haz clic en el encabezado del grupo para expandir o contraer
- El encabezado muestra el nombre de la columna y el número de tareas

---

## 9. Gestión de tareas

### 9.1 Crear una tarea

**Opción A — Desde el botón de columna (Kanban):**
1. Haz clic en el botón **"+"** en el encabezado de cualquier columna
2. Se abre el diálogo "Nueva tarea"

**Opción B — Desde la vista Tabla:**
1. En la vista tabla, busca el botón de nueva tarea en el grupo de columna correspondiente

**Campos del formulario:**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Título** | Sí | Nombre breve de la tarea (máx. 500 caracteres) |
| **Descripción** | No | Detalle extendido (máx. 2000 caracteres) |
| **Prioridad** | No | Sin prioridad / Baja / Media / Alta / Urgente |
| **Colaboradores** | No | Selección múltiple de miembros del workspace |
| **Fecha de inicio** | No | Selector de fecha |
| **Fecha de finalización** | No | Selector de fecha (debe ser ≥ fecha de inicio) |
| **Progreso** | No | Deslizador de 0% a 100% (paso de 5%) |

3. Haz clic en **"Crear tarea"**

La tarea aparece al final de la columna seleccionada.

### 9.2 Editar una tarea

1. Haz clic sobre cualquier tarjeta en el tablero Kanban, o en una fila de la vista Tabla
2. Se abre el diálogo "Editar tarea"
3. Modifica los campos que necesites:

**Información básica:**
- Título y descripción

**Prioridad y colaboradores:**
- Prioridad (lista desplegable)
- Colaboradores: casillas de selección para agregar o quitar personas del equipo

**Relaciones entre tareas:**
- **Tarea Padre:** Agrupa esta tarea bajo otra (para crear hitos o grupos)
  - Selecciona una tarea del mismo tablero como padre
  - Útil para crear jerarquías: Épica → Tarea → Subtarea
  - > ⚠️ **Bloqueo:** La tarea hijo no puede avanzar (moverse a una columna posterior) hasta que la tarea padre esté al **100%** de progreso.
- **Dependencias:** Tareas que deben completarse antes que esta
  - Selecciona una o varias tareas como prerrequisito
  - Se visualizan en la vista Gantt
  - > ⚠️ **Bloqueo:** La tarea no puede avanzar hasta que **todas sus dependencias** estén al 100%.

**Subtareas:**
- Haz clic en **"+"** junto al encabezado "Subtareas" para agregar una nueva subtarea
- Escribe el título y selecciona el colaborador responsable en el desplegable
- Haz clic en **"Crear"** — la subtarea aparece en la lista (NO en el tablero)
- Cada subtarea muestra: título, avatar del colaborador asignado, 4 pills de estado y una mini barra de progreso con color
- Cambia el estado de la subtarea haciendo clic en el pill correspondiente:
  - **Pendiente** (gris) → 0% de avance
  - **En Proceso** (azul) → 50% de avance
  - **Retrasado** (naranja) → 25% de avance
  - **Completado** (verde) → 100% de avance
- Al cambiar el estado, el progreso del colaborador asignado en la sección "Progreso por Colaborador" se actualiza automáticamente de forma proporcional

**Editar una subtarea:**
1. Pasa el cursor sobre la subtarea — aparece el ícono de lápiz ✏️ en la esquina derecha
2. Haz clic en el lápiz para activar el modo de edición inline
3. Modifica el **título** (también puedes presionar Enter para guardar o Escape para cancelar)
4. Cambia el **colaborador asignado** en el desplegable
5. Haz clic en el ícono ✓ para guardar, o ✕ para cancelar

**Reordenar subtareas:**
- Cada subtarea tiene dos flechas ↑↓ en el lado izquierdo
- Haz clic en ↑ para moverla una posición arriba, ↓ para bajarla
- Las flechas se desactivan automáticamente cuando la subtarea ya está en el extremo superior o inferior
- El orden se guarda en el servidor y persiste al cerrar y reabrir el diálogo

**Eliminar una subtarea:**
1. Pasa el cursor sobre la subtarea — aparece el ícono de papelera 🗑️ junto al lápiz
2. Haz clic en la papelera — aparece "¿Eliminar? ✓ ✕" en rojo
3. Haz clic en ✓ para confirmar la eliminación, o ✕ para cancelar
4. El progreso del colaborador asignado se recalcula automáticamente al eliminar

**Progreso:**
- *Con múltiples colaboradores:* Cada persona tiene su propio deslizador de progreso individual. El progreso total se calcula automáticamente como el promedio.
- *Sin colaboradores:* Un único deslizador de progreso general.

**Sección de comentarios:**
- Ver los comentarios existentes de la tarea
- Escribir y enviar nuevos comentarios

4. Haz clic en **"Guardar cambios"**

### 9.3 Eliminar una tarea

1. Abre el diálogo de edición de la tarea
2. Haz clic en el botón rojo **"Eliminar"** (parte inferior izquierda del diálogo)
3. Confirma en el diálogo de alerta: "¿Eliminar tarea?"
4. La tarea se elimina permanentemente

### 9.4 Mover una tarea entre columnas

**Con arrastre (vista Kanban):**
- Arrastra la tarjeta a la columna destino

**Con edición:**
- Actualmente las tareas se mueven únicamente por arrastre en la vista Kanban

> Al mover una tarea, el progreso y las fechas se actualizan automáticamente según la columna destino. Ver [sección 14.1](#141-progreso-automático-al-mover-tareas).

---

## 10. Colaboradores y asignaciones

Stward Task soporta la asignación de **múltiples colaboradores** a cada tarea, cada uno con su propio progreso individual.

### 10.1 Asignar colaboradores

**Al crear una tarea:**
1. En el formulario "Nueva tarea", busca la sección **"Colaboradores"**
2. Verás la lista de **todos los usuarios del sistema** (no solo del espacio de trabajo actual)
3. Activa las casillas de los colaboradores que quieras asignar

**Al editar una tarea:**
1. Abre el diálogo de edición
2. En "Colaboradores", activa o desactiva las casillas según necesites
3. Guarda los cambios

### 10.2 Progreso individual por colaborador

Cuando una tarea tiene múltiples colaboradores:

- Cada colaborador tiene su **propia barra de progreso** (con color distintivo)
- Puedes ajustar el progreso de cada persona de forma independiente con el deslizador
- El **Progreso Total** es el promedio del progreso de todos los colaboradores
- En la tarjeta Kanban, la barra se segmenta mostrando el avance de cada persona con su color

> **Progreso automático vía subtareas:** Si asignas subtareas a los colaboradores, el sistema calcula automáticamente su progreso individual usando el método proporcional con 4 estados: Pendiente=0%, Retrasado=25%, En Proceso=50%, Completado=100%. El sistema promedia el progreso de todas las subtareas del colaborador. Los deslizadores manuales siguen disponibles para casos donde no hay subtareas.

### 10.3 Colores de colaboradores

El sistema asigna automáticamente un color de Monday.com a cada colaborador:
- Azul, Verde, Rojo, Amarillo, Cyan, Morado, Rosa (rotación)
- El color identifica visualmente a cada persona en la barra de progreso y en los avatares

### 10.4 Notificaciones de asignación

Cuando un colaborador es asignado a una tarea, recibe automáticamente un correo de notificación con el nombre de la tarea y el tablero.

---

## 11. Comentarios

Los comentarios permiten la comunicación directa sobre el avance de una tarea.

### 11.1 Ver comentarios

1. Haz clic en cualquier tarea para abrir el diálogo de edición
2. Desplázate hacia abajo hasta la sección **"Comentarios"**
3. Los comentarios aparecen en orden cronológico (más antiguo primero)

Cada comentario muestra:
- **Ícono de origen:** Azul (aplicación) o ámbar (correo electrónico)
- **Autor:** Nombre del usuario o correo
- **Fecha y hora:** ej. "23 ene, 14:30"
- **Contenido:** Texto del comentario (conserva saltos de línea)

### 11.2 Escribir un comentario

1. En la sección "Comentarios", haz clic en el área de texto: *"Escribe un comentario..."*
2. Escribe tu mensaje
3. Haz clic en **"Enviar"**
4. El comentario aparece inmediatamente en la lista

### 11.3 Comentarios por correo electrónico

Si tienes configurada la integración de correo entrante (Cloudmailin o SendGrid):

1. Cuando se mueve una tarea, los involucrados reciben un email de notificación
2. El email incluye una dirección **Reply-To** especial: `task-{id}@reply.stwards.com`
3. Al responder ese email, tu respuesta se convierte automáticamente en un comentario de la tarea
4. El comentario aparece marcado con el ícono de correo (ámbar)

> Esta función requiere configuración del proveedor de correo entrante en el servidor.

---

## 12. Notificaciones

El sistema de notificaciones te mantiene informado sobre los cambios que te afectan.

### 12.1 Campana de notificaciones

La campana se encuentra en la esquina superior del panel lateral, junto al selector de tema.

- **Sin notificaciones:** Ícono de campana sin badge
- **Con notificaciones:** Badge rojo con el número de notificaciones sin leer
- **Muchas notificaciones:** Badge muestra "99+" si hay más de 99 sin leer

### 12.2 Tipos de notificaciones

| Tipo | Ícono | Color | Cuándo se genera |
|------|-------|-------|-----------------|
| **Asignada** | ✓ | Morado | Cuando te asignan a una tarea |
| **Movida** | → | Azul | Cuando una tarea en la que participas cambia de columna |
| **Comentario** | 💬 | Ámbar | Cuando alguien comenta en una tarea donde participas |
| **Completada** | 🏆 | Verde | Cuando una tarea tuya llega al 100% |

> No recibirás notificaciones de cambios que tú mismo hayas realizado.

### 12.3 Ver y gestionar notificaciones

1. Haz clic en la campana para abrir el panel
2. Las notificaciones sin leer tienen un punto azul y fondo destacado
3. Haz clic en una notificación para marcarla como leída
4. Usa el botón **"Marcar todo leído"** para limpiar todas de una vez

**Formato de tiempo:**
- "ahora" (menos de 1 minuto)
- "hace 5m" (5 minutos)
- "hace 2h" (2 horas)
- "hace 3d" (3 días)

### 12.4 Actualización automática

El contador de notificaciones se actualiza automáticamente **cada 30 segundos** sin necesidad de recargar la página.

### 12.5 Notificaciones por correo electrónico

Además de las notificaciones en la aplicación, el sistema envía correos cuando:

- Una tarea en la que participas es **movida a otra columna**
- Eres **asignado** a una tarea

Los correos contienen:
- Nombre de la tarea
- Columna origen → columna destino
- Porcentaje de progreso
- Nombre del tablero
- Enlace directo al tablero

> Para responder a los correos y que la respuesta llegue como comentario, ver [sección 11.3](#113-comentarios-por-correo-electrónico).

---

## 13. Ajustes de interfaz

### 13.1 Modo claro / oscuro

- Haz clic en el ícono de sol/luna en la esquina superior del panel lateral
- La preferencia se guarda automáticamente en tu navegador

### 13.2 Selector de vistas

En el encabezado de cualquier tablero encontrarás los botones de vista:

| Botón | Vista |
|-------|-------|
| Tablero | Kanban (predeterminada) |
| Tabla | Lista con todas las columnas |
| Dashboard | Estadísticas y gráficas |
| Gantt | Línea de tiempo |

La vista seleccionada persiste mientras navegas en la misma sesión.

### 13.3 Accesibilidad

- **Saltar al contenido:** Enlace oculto al inicio de la página (visible al presionar Tab)
- **Lectores de pantalla:** Todas las acciones tienen etiquetas en español
- **Teclado:** Navegación completa por teclado incluyendo arrastre en Kanban

---

## 14. Comportamiento automático del sistema

### 14.1 Progreso automático al mover tareas

Cuando arrastras una tarea a otra columna, el sistema **calcula automáticamente el progreso** según la posición de la columna en el tablero:

**Ejemplo con 4 columnas:**

| Columna | Posición | Progreso asignado |
|---------|----------|------------------|
| Pendiente | 1 de 4 | **0%** |
| En Progreso | 2 de 4 | **33%** |
| Retrasado | 3 de 4 | **67%** |
| Completado | 4 de 4 | **100%** |

**Reglas:**
- La columna **Completado** siempre asigna **100%**, sin importar su posición
- Mover una tarea hacia atrás **reduce** el progreso proporcionalmente
- Puedes ajustar el progreso manualmente en el diálogo de edición después de mover la tarea

### 14.2 Fechas automáticas

| Evento | Acción automática |
|--------|------------------|
| Tarea movida a columna "En Progreso" | Se establece la **fecha de inicio** como hoy (si no tenía fecha) |
| Tarea movida a columna "Completado" | Se establece la **fecha de finalización** como hoy (si no tenía fecha) |

### 14.3 Notificaciones automáticas

| Evento | Notificación generada para |
|--------|---------------------------|
| Tarea movida a otra columna | Todos los colaboradores asignados + creador de la tarea |
| Nuevo comentario en tarea | Todos los colaboradores + creador (excepto quien comentó) |
| Usuario asignado a tarea | El usuario recién asignado |

### 14.4 Tareas vencidas — Movimiento automático a "Retrasado"

El sistema revisa diariamente (a las 00:05 horas) si existen tareas cuya **fecha de finalización ya pasó** y que aún no están en las columnas "Retrasado" o "Completado". Cuando las encuentra, las mueve automáticamente a la columna **"Retrasado"** del tablero correspondiente.

**Condiciones para el movimiento automático:**
- La tarea tiene fecha de fin establecida y esa fecha ya pasó
- La tarea **no** está en la columna "Retrasado" ni "Completado"
- El tablero tiene una columna con estado semántico "Retrasado"

> Este proceso corre en segundo plano. Al llegar al trabajo al día siguiente, las tareas vencidas ya estarán en la columna correcta.

### 14.5 Progreso automático por subtareas

Cuando asignas subtareas a los colaboradores de una tarea principal, el sistema recalcula automáticamente el progreso individual de cada persona al cambiar el estado de una subtarea:

**Método proporcional:**
- Cada estado de subtarea tiene un valor de progreso:
  - Pendiente → 0% · En Proceso → 50% · Retrasado → 25% · Completado → 100%
- El progreso del colaborador = promedio de sus subtareas

**Condiciones:**
- Solo aplica a colaboradores que tienen al menos una subtarea asignada
- Los colaboradores sin subtareas conservan su progreso manual intacto
- El recálculo ocurre al cambiar el estado de cualquier subtarea

**Ejemplo:**
```
Tarea "Proyecto Web" con colaboradores A, B, C

A tiene: "Diseño" (En Proceso=50%), "Wireframes" (Completado=100%) → (50+100)/2 = 75%
B tiene: "Backend API" (Completado=100%)                           → 100%
C tiene: "Testing" (Retrasado=25%)                                 → 25%

Progreso Total de "Proyecto Web" = (75 + 100 + 25) / 3 = 67%
```

### 14.6 Correos automáticos

Los correos se envían en segundo plano (no bloquean la interfaz):

| Evento | Destinatarios |
|--------|--------------|
| Tarea movida | Colaboradores + creador (excepto quien movió) |
| Nueva asignación | El colaborador recién asignado |

---

## 15. Visibilidad de tareas por rol

Stward Task controla qué tareas puede ver cada usuario según su rol en el sistema.

### 15.1 Roles y permisos

| Rol | Qué tareas ve |
|-----|--------------|
| **Administrador** | Todas las tareas de todos los tableros |
| **Manager** | Todas las tareas de todos los tableros |
| **Usuario regular** | Solo las tareas donde aparece como asignado, colaborador o creador |

> Un usuario regular no puede ver tareas ajenas aunque estén en el mismo tablero.

### 15.2 Acceso a tableros

Todos los miembros de un espacio de trabajo pueden:
- Ver el tablero y sus columnas
- Crear nuevas tareas
- Editar y mover tareas (no solo los propietarios del workspace)

### 15.3 ¿Por qué no veo todas las tareas?

Si eres un usuario regular y un tablero parece tener menos tareas de las esperadas, es porque solo ves las tareas que te involucran directamente. Contacta a un administrador para ser asignado a las tareas que necesitas ver.

---

## 16. Preguntas frecuentes

**¿Por qué no veo todas las tareas del tablero?**
Si tu rol es "usuario regular", solo ves las tareas en las que apareces como asignado, colaborador o creador. Los administradores y managers ven todas las tareas. Ver [sección 15](#15-visibilidad-de-tareas-por-rol).

**¿Por qué las tareas vencidas aparecen en "Retrasado" sin que yo las haya movido?**
El sistema las mueve automáticamente cada noche a las 00:05. Cualquier tarea cuya fecha de fin haya pasado y no esté en "Retrasado" o "Completado" se mueve sola. Ver [sección 14.4](#144-tareas-vencidas--movimiento-automático-a-retrasado).

**¿Puedo asignar colaboradores de otros espacios de trabajo?**
Sí. El selector de colaboradores muestra todos los usuarios activos del sistema, independientemente del espacio de trabajo al que pertenezcan.

**¿Puedo tener varios tableros en un mismo espacio de trabajo?**
Sí, no hay límite de tableros por espacio de trabajo.

**¿Qué pasa si elimino una tarea padre?**
Las subtareas quedan sin padre pero no se eliminan.

**¿Por qué no puedo mover mi tarea a la siguiente columna?**
Si la tarea tiene una tarea padre o dependencias, el sistema bloquea el avance hasta que esas tareas estén al 100%. Completa primero las tareas bloqueantes y luego intenta mover de nuevo. Mover hacia atrás (columnas anteriores) siempre está permitido.

**¿Puedo asignar una tarea a alguien que no está en el sistema?**
Sí, existe un campo "Asignado a (externo)" para escribir el nombre de una persona sin cuenta.

**¿El progreso se actualiza solo cuando muevo la tarea?**
El progreso se calcula automáticamente al mover entre columnas. También puedes ajustarlo manualmente en el diálogo de edición en cualquier momento.

**¿Cómo sé si una tarea está vencida?**
Las tareas con fecha de finalización pasada y progreso menor al 100% muestran un borde rojo y la etiqueta "Vencida" en la tarjeta Kanban.

**¿Las notificaciones llegan en tiempo real?**
El contador se actualiza cada 30 segundos automáticamente. Para notificaciones inmediatas, puedes recargar la página.

**¿Puedo comentar desde el correo electrónico?**
Sí, si el administrador tiene configurada la integración de correo entrante. Al responder el email de notificación, tu respuesta llega como comentario a la tarea correspondiente.

**¿Cuántos colaboradores puede tener una tarea?**
No hay límite definido, aunque se recomiendan máximo 7-10 para que la barra de progreso sea legible.

**¿Las dependencias entre tareas bloquean el flujo?**
Sí. Si una tarea tiene dependencias, no puede moverse a una columna más avanzada hasta que todas sus dependencias estén al 100% de progreso. El sistema mostrará un mensaje de error con el nombre de las dependencias pendientes.

---

## 17. Inicio de sesión con Google (SSO)

### 17.1 ¿Qué es el inicio de sesión con Google?

Stward Task admite autenticación con Google (SSO). En lugar de recordar una contraseña separada, puedes usar tu cuenta de Google Workspace para acceder directamente.

**Requisito:** Tu correo electrónico (o dominio) debe estar en la lista de acceso autorizado. Si no puedes iniciar sesión, contacta al administrador para que agregue tu correo.

### 17.2 Cómo iniciar sesión con Google

1. Ve a la pantalla de login (`/login`)
2. Haz clic en el botón **"Continuar con Google"**
3. Se abrirá el selector de cuentas de Google
4. Selecciona tu cuenta de Google Workspace
5. Si tu correo está autorizado, entrarás directamente a la aplicación
6. Si no está autorizado, verás el mensaje: *"Tu cuenta no tiene acceso. Contacta al administrador."*

> **Primera vez:** Si es tu primer acceso con Google, el sistema creará automáticamente tu cuenta con el rol pre-asignado y un espacio de trabajo inicial.

### 17.3 Login con email y contraseña (respaldo)

El login tradicional con email y contraseña sigue disponible. Úsalo si:
- No tienes cuenta de Google Workspace
- Prefieres autenticarte sin depender de Google
- Eres la cuenta de administrador inicial del sistema

---

## 18. Control de Acceso (Administradores)

### 18.1 ¿Qué es el Control de Acceso?

El panel de **Control de Acceso** (`/admin/users`) permite a los administradores gestionar quién puede ingresar al sistema con Google y qué rol tendrá al registrarse por primera vez.

> Solo los usuarios con rol **Administrador** pueden ver y usar este panel. El enlace "Control de Acceso" aparece en la parte inferior de la barra lateral izquierda.

### 18.2 Acceder al panel

1. En la barra lateral izquierda, en la parte inferior, haz clic en **"Control de Acceso"** (icono de escudo)
2. Solo visible para administradores

### 18.3 Agregar un correo específico

1. En el formulario superior, selecciona **"Correo específico"**
2. Escribe el correo electrónico completo (ej: `juan@stwards.com`)
3. Selecciona el rol que tendrá al registrarse: Administrador, Gestor, Desarrollador u Observador
4. Haz clic en **"Agregar"** (o presiona Enter)

El correo aparecerá en la tabla con estado **"Pendiente"** hasta que el usuario haga su primer login.

### 18.4 Agregar un dominio completo

Si quieres dar acceso a todos los correos de un dominio (ej: todos los `@stwards.com`):

1. Selecciona **"Dominio completo"**
2. Escribe solo el dominio, sin el `@` (ej: `stwards.com`)
3. Selecciona el rol para todos los que se registren con ese dominio
4. Haz clic en **"Agregar"**

> **Prioridad:** Si un correo específico y un dominio coexisten en la lista, el correo específico tiene prioridad sobre el dominio al asignar el rol.

### 18.5 Importar lista CSV

Para agregar múltiples correos/dominios a la vez:

1. Prepara un archivo `.csv` con este formato:
   ```
   email_o_dominio,rol
   juan@stwards.com,desarrollador
   maria@empresa.com,gestor
   stwards.com,observador
   ```
   (La primera fila es el encabezado y se ignora)
2. Haz clic en el botón **"CSV"**
3. Selecciona tu archivo
4. Las entradas se importan automáticamente

**Roles válidos:** `administrador`, `gestor`, `desarrollador`, `observador`

### 18.6 Eliminar una entrada

1. En la tabla, localiza la entrada a eliminar
2. Haz clic en el ícono de papelera al final de la fila
3. Aparecerá una confirmación inline: **"¿Eliminar? ✓ ✕"**
4. Haz clic en ✓ para confirmar o ✕ para cancelar

> **Nota:** Eliminar una entrada de la lista no elimina al usuario si ya se registró. Solo impide que nuevos usuarios con ese correo/dominio se registren en el futuro.

### 18.7 Estado de las entradas

| Estado | Significado |
|--------|-------------|
| **Pendiente** | El correo/dominio está en la lista pero nadie se ha registrado aún |
| **Activo** | Al menos un usuario se ha registrado usando esta entrada |

---

*Manual generado automáticamente a partir del código fuente de Stward Task v1.4*
*Dominio: stwards.com · Soporte: contacta al administrador de tu instancia*
