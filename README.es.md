<div align="center">

  <img src="docs/assets/logo.svg" alt="Tab Vault" width="120" height="120" />

  # Tab Vault

  **Gestión de sesiones de nivel empresarial para Chrome**

  Guarda, organiza y restaura sesiones de navegador con precisión militar.

  [![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chrome.google.com)
  [![Manifest V3](https://img.shields.io/badge/Manifest-V3-00C853?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/intro/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

  [Características](#-características) •
  [Instalación](#-instalación) •
  [Uso](#-uso) •
  [Desarrollo](#-desarrollo) •
  [Documentación](#-documentación)

</div>

---

> 🇬🇧 **[English README](README.md)** available here.

## 📋 Tabla de Contenidos

- [Resumen](#-resumen)
- [Características](#-características)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Atajos de Teclado](#-atajos-de-teclado)
- [Desarrollo](#-desarrollo)
- [Arquitectura](#-arquitectura)
- [Privacidad](#-privacidad-y-seguridad)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎯 Resumen

**Tab Vault** es una extensión de Chrome de próxima generación diseñada para profesionales que exigen excelencia en la gestión de sesiones. Construida desde cero con arquitectura **Manifest V3**, ofrece rendimiento, seguridad y fiabilidad inigualables.

### ¿Por qué Tab Vault?

| Desafío | Solución |
|-----------|----------|
| Pestañas perdidas tras error | **Recuperación automática** con auto-guardado inteligente |
| Flujos desorganizados | **Categorización inteligente** con etiquetas y nombres personalizados |
| Restauración lenta | **Carga optimizada** con inicialización diferida (lazy loading) |
| Limitaciones de almacenamiento | **Compresión LZ-String** para almacenamiento eficiente |
| Búsqueda compleja | **Búsqueda difusa** impulsada por Fuse.js |

---

## ✨ Características

<table>
<tr>
<td width="50%">

### 📁 Gestión de Sesiones
- Captura de sesión con un clic
- Nombres inteligentes auto-generados
- Etiquetas (tags) y categorías personalizadas
- Soporte para operaciones en masa
- Fijado de sesiones y favoritos

</td>
<td width="50%">

### 🔄 Motor de Restauración
- Restauración de sesión completa
- Recuperación selectiva de pestañas
- Opciones de Nueva Ventana/Ventana Actual
- Opción de **Limpiar pestañas anteriores** al restaurar
- Preservación de Grupos de Pestañas de Chrome
- Memoria de posición de scroll

</td>
</tr>
<tr>
<td width="50%">

### 🔍 Búsqueda y Descubrimiento
- Búsqueda difusa instantánea
- Filtrado avanzado (fecha, etiquetas, tipo)
- Previsualización de pestañas antes de restaurar
- Historial de línea de tiempo de sesiones
- Atajos de acceso rápido

</td>
<td width="50%">

### 💾 Gestión de Datos
- Copias de seguridad automáticas por intervalo
- Exportación/Importación JSON
- Compresión LZ-String
- Integración con Chrome Sync
- Optimización de almacenamiento

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Recuperación de Fallos (Crash Recovery)
- Rastreo de sesión en tiempo real
- Persistencia automática de estado
- Sistema de puntos de control de recuperación
- Validación de integridad de datos

</td>
<td width="50%">

### ⚡ Rendimiento
- Huella de memoria mínima
- Arquitectura de carga diferida (lazy loading)
- Service worker en segundo plano
- Actualizaciones DOM eficientes
- **Carga en Carrusel** para pestañas listas al usar

</td>
</tr>
</table>

---

## 📥 Instalación

### Chrome Web Store

> 🚧 **Próximamente** — Actualmente en desarrollo

### Instalación Manual

```bash
# Clonar repositorio
git clone https://github.com/NicolasDuranGarces/tab-vault.git

# Navegar al proyecto
cd tab-vault

# Instalar dependencias
make install

# Construir extensión
make build
```

**Cargar en Chrome:**

1. Navega a `chrome://extensions/`
2. Activa el **Modo desarrollador** (interruptor arriba a la derecha)
3. Haz clic en **Cargar descomprimida** (Load unpacked)
4. Selecciona el directorio `dist`

---

##  Uso

### Guardado Rápido

```
Clic en icono Tab Vault → Save Current Session → Listo ✓
```

### Restaurar Sesión

```
Abre Tab Vault → Busca la sesión → Clic en Restore → Elige opciones
```

### Gestor de Sesiones (Manager)

Accede al gestor completo para operaciones avanzadas:
- Editar metadatos de sesión
- Operaciones de borrado en lote
- Exportar/Importar sesiones
- Configurar ajustes de auto-guardado y limpieza

---

## ⌨️ Atajos de Teclado

| Atajo | Acción | Plataforma |
|----------|--------|----------|
| `Ctrl + Shift + S` | Guardar sesión actual | Windows/Linux |
| `Cmd + Shift + S` | Guardar sesión actual | macOS |
| `Ctrl + Shift + R` | Restaurar última sesión | Windows/Linux |
| `Cmd + Shift + R` | Restaurar última sesión | macOS |
| `Ctrl + Shift + V` | Abrir Tab Vault | Windows/Linux |
| `Cmd + Shift + V` | Abrir Tab Vault | macOS |

> **Pro Tip:** Personaliza los atajos en `chrome://extensions/shortcuts`

---

## 🛠️ Desarrollo

### Requisitos

| Requisito | Versión |
|-------------|---------|
| Node.js | 18.0+ |
| npm | 9.0+ |
| Make | 3.0+ (opcional) |

### Inicio Rápido

```bash
# Instalar dependencias
make install

# Iniciar servidor de desarrollo (hot reload)
make dev

# Ejecutar linting
make lint

# Ejecutar pruebas
make test
```

### Comandos Disponibles

```bash
make install        # Instalar dependencias
make dev            # Modo desarrollo (watch)
make build          # Construcción para producción
make lint           # Ejecutar ESLint
make lint-fix       # Auto-corregir problemas de lint
make type-check     # Validación TypeScript
make test           # Ejecutar suite de pruebas
make test-coverage  # Generar reporte de cobertura
make package        # Crear ZIP distribuible
make clean          # Eliminar artefactos de construcción
make help           # Mostrar todos los comandos
```

---

## 🏗️ Arquitectura

```
tab-vault/
├── src/
│   ├── background/          # Service worker
│   ├── content/             # Content scripts
│   ├── popup/               # Extension popup UI
│   ├── pages/               # Full-page manager
│   ├── services/            # Capa de lógica de negocio
│   ├── utils/               # Funciones de utilidad
│   ├── types/               # Definiciones TypeScript
│   └── manifest.json        # Manifiesto de extensión
├── dist/                    # Salida de construcción
├── docs/                    # Documentación
├── Makefile                 # Automatización de construcción
├── webpack.config.js        # Configuración de empaquetado
└── tsconfig.json            # Configuración TypeScript
```

---

## 🔒 Privacidad y Seguridad

| Permiso | Propósito |
|------------|---------|
| `tabs` | Acceso a URLs y títulos de pestañas |
| `storage` | Almacenamiento local de sesiones |
| `alarms` | Auto-respaldos programados |
| `scripting` | Captura de posición de scroll |

> **🔐 Tus datos nunca salen de tu navegador.** Tab Vault opera enteramente de forma local con cero transmisión de datos externa.

---

## 🤝 Contribuir

Damos la bienvenida a contribuciones de la comunidad.

```bash
# Fork del repositorio
# Crear rama de funcionalidad
git checkout -b feature/funcionalidad-increible

# Commit de cambios
git commit -m 'feat: añadir funcionalidad increible'

# Push a la rama
git push origin feature/funcionalidad-increible

# Abrir Pull Request
```

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT** — ver el archivo [LICENSE](LICENSE) para detalles.

---

<div align="center">

  **Construido con precisión por [Nicolas Duran Garces](https://github.com/NicolasDuranGarces)**

  ⭐ Dale una estrella a este repositorio si Tab Vault mejora tu flujo de trabajo

  <sub>© 2024 Tab Vault. Todos los derechos reservados.</sub>

</div>
