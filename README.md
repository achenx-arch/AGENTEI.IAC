# 🤖 Agente IA - Oracle HR Database

> Sistema inteligente que convierte lenguaje natural en consultas SQL para Oracle Database

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Oracle](https://img.shields.io/badge/Oracle-Database-red.svg)](https://www.oracle.com/database/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📋 Descripción

Agente IA que permite interactuar con la base de datos Oracle HR usando lenguaje natural. Convierte automáticamente tus preguntas en consultas SQL y ejecuta operaciones de lectura y escritura con confirmación de usuario.

## ✨ Características

- 🗣️ **Lenguaje Natural**: Escribe preguntas como hablarías normalmente
- 🔒 **Confirmación de Operaciones**: Modal de seguridad para operaciones de modificación (INSERT, UPDATE, DELETE)
- 🔄 **Cambios en Tiempo Real**: Los cambios se reflejan inmediatamente en Oracle SQL Developer
- 🧠 **Sistema de Aprendizaje**: Mejora con cada consulta que realizas
- 🌐 **Acceso Remoto**: Disponible desde cualquier dispositivo en tu red
- 📊 **Soporte Completo**: Todas las tablas del esquema HR (employees, departments, regions, countries, locations, jobs, job_history)

## 📁 Estructura del Proyecto

```
.
├── agente-bd-ia/
│   ├── backend/              # Servidor Node.js
│   │   ├── server.js        # Servidor principal
│   │   ├── agent-simple.js  # Generador de SQL
│   │   ├── agent-learning.js # Sistema de aprendizaje
│   │   ├── knexfile.js      # Configuración de BD
│   │   ├── .env             # Variables de entorno (NO en Git)
│   │   ├── .env.example     # Plantilla de configuración
│   │   └── package.json     # Dependencias
│   ├── frontend/            # Interfaz web
│   │   ├── index.html       # Página principal
│   │   ├── script.js        # Lógica del cliente
│   │   └── style.css        # Estilos y modales
│   ├── README.md            # Documentación técnica detallada
│   └── RESUMEN-FINAL-COMPLETO.md # Guía de características
├── INICIAR-AGENTE-DEFINITIVO.bat  # Script para iniciar el servidor
├── LIMPIAR-ARCHIVOS-DUPLICADOS.bat # Script de limpieza
└── README.md                # Este archivo
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ instalado
- Oracle Database con esquema HR instalado
- Oracle Instant Client configurado

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TU_USUARIO/agente-ia-oracle.git
   cd agente-ia-oracle
   ```

2. **Configurar variables de entorno**
   ```bash
   cd agente-bd-ia/backend
   copy .env.example .env
   ```
   
   Edita `.env` con tus credenciales:
   ```env

3. **Instalar dependencias**
   ```bash
   npm install
   ```

4. **Iniciar el servidor**
   
   **Opción A - Script automático (Windows):**
   ```bash
   cd ../..
   INICIAR-AGENTE-DEFINITIVO.bat
   ```
   
   **Opción B - Manual:**
   ```bash
   node server.js
   ```

5. **Abrir en navegador**
   ```
   http://localhost:3000
   ```

## 💡 Ejemplos de Uso

### Consultas SELECT (ejecución automática)

```
"¿Cuántos empleados hay?"
"Muéstrame todos los departamentos"
"Empleados con salario mayor a 10000"
"Lista de países en Europa"
"Ubicaciones en Estados Unidos"
```

### Operaciones de Modificación (requieren confirmación)

```
"Agregar nuevo empleado John Doe con salario 5000"
"Actualizar salario del empleado 100 a 8000"
"Eliminar empleado con id 200"
```

## 📊 Datos Disponibles

| Tabla | Registros | Descripción |
|-------|-----------|-------------|
| employees | 107 | Empleados de la organización |
| departments | 27 | Departamentos |
| regions | 4 | Regiones geográficas |
| countries | 25 | Países |
| locations | 23 | Ubicaciones de oficinas |
| jobs | 19 | Puestos de trabajo |
| job_history | 10 | Historial de trabajos |

## 🌐 Acceso desde Red

1. **Iniciar servidor** (mostrará la IP de red)
2. **Desde otro dispositivo** en la misma red:
   ```
   http://[IP_DEL_SERVIDOR]:3000
   ```

### Configurar Firewall (si es necesario)
```powershell
netsh advfirewall firewall add rule name="Agente IA" dir=in action=allow protocol=TCP localport=3000
```

## 🛠️ Solución de Problemas

### Error: "Oracle client libraries are required"
- Instala Oracle Instant Client
- Agrega al PATH del sistema
- Reinicia la terminal

### Error: "Cannot connect to database"
- Verifica que Oracle esté corriendo
- Revisa las credenciales en `.env`
- Prueba la conexión con SQL Developer

### Error: "Port 3000 already in use"
```powershell
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

## 🧹 Mantenimiento

### Limpiar archivos duplicados
```bash
LIMPIAR-ARCHIVOS-DUPLICADOS.bat
```

### Ver estadísticas de aprendizaje
```
http://localhost:3000/api/learning-stats
```

### Reiniciar base de datos (solo SQLite)
```bash
cd agente-bd-ia/backend
node init-database.js
```

## 📚 Documentación Adicional

- [README técnico completo](agente-bd-ia/README.md)
- [Resumen de características](agente-bd-ia/RESUMEN-FINAL-COMPLETO.md)
- [Oracle HR Schema](https://github.com/oracle/db-sample-schemas)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## ✨ Autor

**ACHX13**

## 🙏 Agradecimientos

- Oracle por el esquema HR de ejemplo
- Comunidad de Node.js
- OpenAI por las APIs de IA








