

## Introducción

Learning Agent es una aplicación full-stack diseñada para facilitar el aprendizaje y la gestión de contenido educativo. El proyecto está construido con tecnologías modernas y sigue las mejores prácticas de desarrollo, incluyendo arquitectura de microservicios, contenedores Docker y despliegue en Kubernetes.

## Estructura del Repositorio

El proyecto está organizado en tres componentes principales:

- **[Backend](./backend/README.md)** - API REST desarrollada con NestJS y TypeScript
- **[Client](./client/README.md)** - Aplicación frontend construida con React y Vite
- **[Infra](./infra/README.md)** - Configuraciones de Docker y Kubernetes

## Quick Start

Para levantar el proyecto completo, sigue estos pasos esenciales:

### 1. Infraestructura
```bash
cd infra
# Ver configuración detallada en ./infra/README.md
```

### 2. Backend
```bash
cd backend
npm install
npm run start:dev
# Ver detalles en ./backend/README.md
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
# Ver detalles en ./client/README.md
```

> **Nota**: Para instrucciones detalladas de configuración, dependencias y despliegue, consulta [Como-levantar-el-proyecto.md](./Como-levantar-el-proyecto.md).

## Documentación Adicional

- **[Como-levantar-el-proyecto.md](./Como-levantar-el-proyecto.md)** - Guía completa de configuración y despliegue
- **[Backend README](./backend/README.md)** - Documentación específica del API
- **[Client README](./client/README.md)** - Documentación del frontend
- **[Infra README](./infra/README.md)** - Configuración de infraestructura

## Notas Importantes

- **Docker**: El proyecto incluye configuraciones Docker para cada componente
- **Kubernetes**: Configuraciones K8s disponibles en el directorio `infra/k8s`
- **Testing**: El cliente incluye pruebas E2E con Cypress
- **CI/CD**: Configuraciones Jenkins disponibles para backend y client
- **Base de Datos**: El backend utiliza Prisma como ORM
- **Desarrollo**: Configuraciones ESLint y Prettier para mantener calidad de código

## Tecnologías Utilizadas

- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend**: React, Vite, TypeScript, Cypress
- **Infraestructura**: Docker, Kubernetes, Jenkins
- **Herramientas**: ESLint, Prettier, Husky