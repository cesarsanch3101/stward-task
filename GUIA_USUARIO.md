# Guía Rápida de Usuario — Stward Task

**Versión:** 1.8 · **Idioma:** Español · **Fecha:** Marzo 2026
**URL de acceso:** https://stward-task-1cbf3.web.app

---

## ¿Qué es Stward Task?

Stward Task es una herramienta de gestión de proyectos en equipo. Organiza el trabajo en **tableros** con columnas de estado (Pendiente → En Progreso → Completado) y permite que todo el equipo vea el avance en tiempo real.

---

## 1. Primeros pasos

### Iniciar sesión

Tienes dos opciones:

| Opción | Cuándo usarla |
|--------|--------------|
| **Continuar con Google** | Si tu correo está en la lista de acceso autorizado |
| **Email + contraseña** | Si tienes credenciales propias o eres el administrador inicial |

> Cuenta de prueba: `admin@stwards.com` / `admin123`

Si al intentar entrar con Google ves *"Tu cuenta no tiene acceso"*, contacta al administrador del sistema para que autorice tu correo.

---

## 2. La pantalla principal

Al entrar verás:

```
┌──────────────────────────────────────────────────────────────────┐
│ PANEL LATERAL       │         ÁREA PRINCIPAL                     │
│                     │                                            │
│ [◀ colapsar]        │  [Tablero] [Tabla] [Dashboard] [Gantt]    │
│                     │                                            │
│ Workspace A         │   PENDIENTE    EN PROGRESO    COMPLETADO   │
│  └ Tablero 1  ←     │   ┌────────┐  ┌────────┐    ┌────────┐   │
│  └ Tablero 2        │   │Tarea A │  │Tarea C │    │Tarea F │   │
│                     │   └────────┘  └────────┘    └────────┘   │
│ Workspace B         │                                            │
│  └ Tablero 3        │                                            │
│                     │                                            │
│ [🔔] [☀/🌙]        │                                            │
└──────────────────────────────────────────────────────────────────┘
```

**Panel lateral:** navega entre workspaces y tableros. Haz clic en ◀ para colapsarlo y ganar espacio.

**Vistas disponibles** (botones en la barra superior del tablero):

| Vista | Para qué sirve |
|-------|----------------|
| **Tablero** (Kanban) | Mover tareas entre columnas con arrastre |
| **Tabla** | Ver todas las tareas en formato de lista |
| **Dashboard** | Estadísticas, gráficas y estado del equipo |
| **Gantt** | Línea de tiempo con fechas de inicio y fin |

---

## 3. Tareas — lo esencial

### Crear una tarea

1. En el **tablero Kanban**, haz clic en **"+"** en el encabezado de una columna.
2. Rellena el formulario:

   | Campo | Descripción |
   |-------|-------------|
   | **Título** | Nombre de la tarea (obligatorio) |
   | **Descripción** | Detalle o instrucciones |
   | **Prioridad** | Sin prioridad / Baja / Media / Alta / Urgente |
   | **Colaboradores** | Personas asignadas (puedes elegir varias) |
   | **Fecha inicio / fin** | Rango de tiempo estimado |
   | **Progreso** | Avance inicial (0–100%) |

3. Clic en **"Crear tarea"**.

### Editar una tarea

1. Haz clic sobre la tarjeta en el Kanban (o en el ícono de lápiz en la Tabla).
2. Modifica los campos que necesites.
3. Clic en **"Guardar cambios"**.

> Todos los roles pueden **abrir** el diálogo. Solo Administradores y Gestores pueden **guardar cambios**. Desarrolladores y Observadores tienen acceso de solo lectura.

### Mover una tarea (solo Administradores)

**En el Kanban:** arrastra la tarjeta a otra columna.
Al soltarla, el progreso se actualiza automáticamente según la posición de la columna.

| Columna destino | Progreso asignado |
|-----------------|------------------|
| Pendiente | 0% |
| En Progreso | ~33% |
| Retrasado | ~67% |
| Completado | 100% |

> Si la tarea tiene **dependencias** sin completar, el sistema bloqueará el avance hasta que estén al 100%.

### Eliminar una tarea (solo Administradores)

1. Abre el diálogo de edición.
2. Clic en **"Eliminar"** (botón rojo, parte inferior).
3. Confirma la acción.

---

## 4. Subtareas

Las subtareas dividen el trabajo de una tarea principal entre los colaboradores.

### Agregar una subtarea

1. Abre el diálogo de la tarea.
2. En el panel derecho, sección **"Subtareas"**, haz clic en **"+"**.
3. Escribe el título y selecciona al colaborador responsable.
4. Clic en **"Crear"**.

### Estados de la subtarea

Cada subtarea tiene 4 estados que puedes cambiar haciendo clic en el pill correspondiente:

| Estado | Color | Progreso |
|--------|-------|---------|
| **Pendiente** | Gris | 0% |
| **En Proceso** | Azul | 50% |
| **Retrasado** | Naranja | 25% |
| **Completado** | Verde | 100% |

Al cambiar el estado, el progreso del colaborador asignado se actualiza automáticamente (promedio de sus subtareas).

### Gestionar subtareas

| Acción | Cómo hacerlo |
|--------|--------------|
| **Editar** título o asignado | Ícono ✏️ → modifica → ✓ para guardar |
| **Reordenar** | Flechas ↑↓ en el lado izquierdo de la subtarea |
| **Eliminar** | Ícono 🗑️ → confirma con ✓ |

> Las subtareas NO aparecen en el tablero Kanban; solo en el diálogo de la tarea padre.

---

## 5. Colaboradores y progreso

### Asignar personas a una tarea

- En el formulario de creación/edición, activa las casillas de los colaboradores.
- Puedes seleccionar a cualquier usuario activo del sistema.

### Progreso por colaborador

Cuando hay varios colaboradores, cada uno tiene su **propia barra de progreso** (deslizador independiente). El progreso total es el promedio de todos.

En la tarjeta Kanban, la barra se divide en segmentos de colores — uno por persona.

---

## 6. Comentarios

Los comentarios permiten discutir el avance directamente en la tarea.

1. Abre el diálogo de cualquier tarea.
2. Desplázate hasta la sección **"Comentarios"**.
3. Escribe tu mensaje y haz clic en **"Enviar"** (o presiona **Ctrl+Enter**).

**Responder por correo:** si recibes un email de notificación de la tarea, puedes responderlo directamente desde tu cliente de correo y la respuesta llegará como comentario.

---

## 7. Notificaciones

La **campana 🔔** en el panel lateral muestra las alertas pendientes.

| Tipo | Cuándo llega |
|------|-------------|
| Asignada | Alguien te asignó a una tarea |
| Movida | Una tarea en la que participas cambió de columna |
| Comentario | Alguien comentó en una tarea donde participas |
| Completada | Una tarea tuya llegó al 100% |

El contador se actualiza automáticamente cada 30 segundos. También recibirás un **correo electrónico** para las notificaciones más importantes.

---

## 8. Vistas avanzadas

### Dashboard

Muestra el estado general del proyecto:
- **KPIs:** total de tareas, completadas, progreso promedio, colaboradores activos.
- **Distribución por estado:** gráfica de dona con el conteo por columna.
- **Carga del equipo:** quién tiene qué tareas y en qué estado.

**Exportar:**
- **CSV** — descarga todas las tareas en formato Excel.
- **PDF** — imprime o guarda el dashboard como PDF.

### Gantt

Muestra las tareas en una **línea de tiempo** según sus fechas de inicio y fin.
- Usa los botones **Días / Semanas / Meses** para cambiar el zoom.
- La línea vertical roja indica hoy.
- Las barras en rojo son tareas vencidas.

> Solo aparecen las tareas que tienen fecha de inicio Y fecha de fin configuradas.

### Dashboard & Gantt del Workspace

Haz clic en el **nombre del workspace** (el recuadro en el panel lateral) para ver una vista consolidada de todos los tableros juntos.

---

## 9. Comportamientos automáticos

| Qué pasa | Cuándo ocurre |
|----------|--------------|
| El progreso cambia al mover una tarea | Al soltar en otra columna |
| La fecha de inicio se registra automáticamente | Al mover a "En Progreso" (si no tenía fecha) |
| La fecha de fin se registra automáticamente | Al mover a "Completado" (si no tenía fecha) |
| La tarea se mueve a "Retrasado" | Diariamente a las 00:05 si la fecha fin ya pasó |
| El progreso del colaborador se recalcula | Al cambiar el estado de una subtarea |
| El tablero se refresca con cambios del equipo | Cada 30 segundos automáticamente |

---

## 10. Roles y permisos

| Acción | Administrador | Gestor | Desarrollador | Observador |
|--------|:---:|:---:|:---:|:---:|
| Ver todas las tareas del tablero | ✅ | ❌ (solo sus tareas) | ❌ (solo sus tareas) | ❌ (solo sus tareas) |
| Mover tareas (drag & drop) | ✅ | ❌ | ❌ | ❌ |
| Crear tareas (Vista Tabla) | ✅ | ❌ | ❌ | ❌ |
| Editar campos inline (Tabla) | ✅ | ❌ | ❌ | ❌ |
| Abrir diálogo de edición | ✅ | ✅ | ✅ | ✅ |
| Guardar cambios en el diálogo | ✅ | ✅ | ❌ | ❌ |
| Gestionar subtareas | ✅ | ✅ | ❌ | ❌ |
| Escribir comentarios | ✅ | ✅ | ✅ | ✅ |
| Eliminar tareas | ✅ | ❌ | ❌ | ❌ |
| Panel Control de Acceso | ✅ | ❌ | ❌ | ❌ |

> **Gestor y Desarrollador** solo ven las tareas donde aparecen como asignado, colaborador o creador.
> **Desarrollador y Observador** solo pueden leer y escribir comentarios — todos los demás campos del diálogo están bloqueados.

---

## 11. Atajos de teclado y consejos rápidos

| Atajo | Acción |
|-------|--------|
| **Ctrl+Enter** | Enviar comentario |
| **Enter** | Guardar título al editar subtarea inline |
| **Escape** | Cancelar edición inline |
| **Tab** | Navegar entre elementos (accesibilidad) |

**Consejos:**
- Colapsa el sidebar (◀) para ver más espacio del tablero.
- Haz clic en la **campana** para ver notificaciones sin perder el contexto.
- En el **Gantt**, usa "Ajustar" para ver todas las tareas en pantalla.
- Responde los correos de notificación directamente — la respuesta llega como comentario.

---

## 12. Preguntas frecuentes

**No puedo mover tareas en el tablero.**
Solo los Administradores pueden hacer drag & drop. Si necesitas mover una tarea, pídele al administrador que lo haga o que cambie tu rol.

**No veo todas las tareas del tablero.**
Si tu rol es Gestor, Desarrollador u Observador, solo ves las tareas en las que participas directamente. El administrador puede asignarte a más tareas.

**Una tarea apareció sola en "Retrasado".**
El sistema mueve automáticamente las tareas cuya fecha de finalización ya pasó. Revisa la fecha límite y actualízala si es necesario.

**No puedo guardar cambios en una tarea.**
Si eres Desarrollador u Observador, el diálogo está en modo solo lectura. Solo puedes agregar comentarios. El pie del diálogo mostrará el mensaje correspondiente.

**¿Por qué no puedo mover la tarea a la siguiente columna?**
Tiene dependencias pendientes. Todas las tareas marcadas como requisito deben estar al 100% antes de avanzar.

**El tablero no muestra cambios que hizo otro usuario.**
El tablero se actualiza automáticamente cada 30 segundos. También puedes recargar la página (F5) para forzar la actualización.

---

*Stward Task · stwards.com · Soporte: contacta al administrador de tu instancia*
