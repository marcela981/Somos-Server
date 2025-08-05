# Somos Server - Backend API

Backend serverless para la aplicación de fitness con IA usando Google Cloud Platform.

## 🏗️ Arquitectura

### **Stack Tecnológico**
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Base de Datos**: Google Cloud Firestore
- **IA**: Google AI Platform (Gemini)
- **Storage**: Google Cloud Storage
- **Deployment**: Google Cloud Run / App Engine
- **Autenticación**: JWT
- **Logging**: Winston

### **Estructura del Proyecto**
```
somos-server/
├── src/
│   ├── app.js                 # Aplicación principal Express
│   ├── routes/                # Rutas de la API
│   │   ├── auth.js           # Autenticación
│   │   ├── users.js          # Gestión de usuarios
│   │   ├── workouts.js       # Entrenamientos
│   │   ├── progress.js       # Progreso
│   │   ├── ai.js             # IA
│   │   └── nutrition.js      # Nutrición
│   ├── controllers/           # Lógica de negocio
│   ├── services/             # Servicios externos
│   │   ├── databaseService.js # Firestore
│   │   ├── aiService.js      # Google AI
│   │   └── loggerService.js  # Winston
│   ├── middleware/            # Middleware
│   │   ├── auth.js           # Autenticación JWT
│   │   ├── validation.js     # Validación
│   │   └── errorHandler.js   # Manejo de errores
│   └── utils/                # Utilidades
├── scripts/                  # Scripts de deployment
├── tests/                    # Tests
├── app.yaml                  # Configuración App Engine
├── package.json              # Dependencias
└── env.example              # Variables de entorno
```

## 🚀 Configuración Inicial

### **1. Prerrequisitos**
- Node.js 18+
- Google Cloud SDK
- Cuenta de Google Cloud Platform

### **2. Instalación**
```bash
# Clonar repositorio
git clone <tu-repositorio>
cd somos-server

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales
```

### **3. Configurar Google Cloud Platform**

#### **Crear Proyecto**
```bash
# Crear proyecto en GCP
gcloud projects create somos-fitness-app

# Configurar proyecto
gcloud config set project somos-fitness-app
```

#### **Habilitar APIs**
```bash
# Habilitar APIs necesarias
gcloud services enable firestore.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable run.googleapis.com
```

#### **Configurar Firestore**
```bash
# Crear base de datos Firestore
gcloud firestore databases create --region=us-central1
```

#### **Configurar Service Account**
```bash
# Crear service account
gcloud iam service-accounts create somos-api \
  --display-name="Somos API Service Account"

# Asignar roles
gcloud projects add-iam-policy-binding somos-fitness-app \
  --member="serviceAccount:somos-api@somos-fitness-app.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding somos-fitness-app \
  --member="serviceAccount:somos-api@somos-fitness-app.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Crear y descargar key
gcloud iam service-accounts keys create credentials/service-account-key.json \
  --iam-account=somos-api@somos-fitness-app.iam.gserviceaccount.com
```

### **4. Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar con tus valores
NODE_ENV=development
PORT=8080
GOOGLE_CLOUD_PROJECT_ID=somos-fitness-app
GOOGLE_APPLICATION_CREDENTIALS=./credentials/service-account-key.json
JWT_SECRET=tu-jwt-secret-super-seguro
GOOGLE_AI_API_KEY=tu-api-key-de-gemini
```

## 🛠️ Desarrollo

### **Comandos Disponibles**
```bash
# Desarrollo local
npm run dev

# Tests
npm test

# Linting
npm run lint

# Build
npm run build

# Deploy a App Engine
npm run deploy

# Deploy a Cloud Run
npm run deploy:run

# Configurar Google Sheets
npm run setup:sheets
npm run setup:sheets:sample
```

### **Estructura de la API**

#### **Autenticación**
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Autenticación
- `GET /api/auth/profile` - Perfil del usuario

#### **Usuarios**
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `POST /api/users/:id/onboarding` - Completar onboarding

#### **Entrenamientos**
- `GET /api/workouts` - Lista de entrenamientos
- `GET /api/workouts/:id` - Obtener entrenamiento
- `POST /api/workouts` - Crear entrenamiento
- `PUT /api/workouts/:id` - Actualizar entrenamiento
- `DELETE /api/workouts/:id` - Eliminar entrenamiento
- `POST /api/workouts/:id/feedback` - Agregar feedback

#### **Progreso**
- `GET /api/progress` - Progreso del usuario
- `POST /api/progress/weight` - Registrar peso
- `POST /api/progress/measurements` - Registrar medidas
- `GET /api/progress/analytics` - Análisis de progreso

#### **IA**
- `POST /api/ai/recommendations` - Recomendaciones personalizadas
- `POST /api/ai/workout-plan` - Generar plan de entrenamiento
- `POST /api/ai/nutrition-advice` - Consejos nutricionales
- `POST /api/ai/analyze-progress` - Análisis de progreso

#### **Nutrición**
- `GET /api/nutrition/goals` - Objetivos nutricionales
- `POST /api/nutrition/log` - Registrar nutrición
- `GET /api/nutrition/history` - Historial nutricional

## 🚀 Deployment

### **Google App Engine**
```bash
# Deploy a App Engine
npm run deploy
```

### **Google Cloud Run**
```bash
# Deploy a Cloud Run
npm run deploy:run
```

### **Google Cloud Functions**
```bash
# Deploy funciones individuales
npm run deploy:functions
```

## 📊 Monitoreo y Logging

### **Logs**
- Los logs se escriben usando Winston
- En desarrollo: Console
- En producción: Archivos + Console
- Niveles: error, warn, info, debug

### **Métricas**
- Health check: `GET /health`
- Métricas de performance automáticas
- Logs de auditoría para acciones críticas

### **Monitoreo**
```bash
# Ver logs en tiempo real
gcloud app logs tail -s default

# Ver métricas
gcloud app browse
```

## 🔒 Seguridad

### **Autenticación**
- JWT tokens
- Expiración configurable
- Refresh tokens (opcional)

### **Validación**
- Express-validator
- Sanitización de inputs
- Rate limiting

### **CORS**
- Configuración por ambiente
- Whitelist de dominios permitidos

### **Rate Limiting**
- 100 requests por 15 minutos por IP
- Configurable por endpoint

## 🧪 Testing

### **Estructura de Tests**
```
tests/
├── unit/              # Tests unitarios
├── integration/       # Tests de integración
├── e2e/              # Tests end-to-end
└── fixtures/         # Datos de prueba
```

### **Ejecutar Tests**
```bash
# Todos los tests
npm test

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Coverage
npm run test:coverage
```

## 📈 Escalabilidad

### **Auto-scaling**
- App Engine: 1-10 instancias
- Cloud Run: 0-1000 instancias
- CPU target: 65%

### **Base de Datos**
- Firestore: Escalado automático
- Índices optimizados
- Paginación implementada

### **Cache**
- Redis (opcional)
- Cache de respuestas de IA
- Cache de datos de usuario

## 🔧 Configuración Avanzada

### **Variables de Entorno**
```bash
# Desarrollo
NODE_ENV=development
LOG_LEVEL=debug

# Producción
NODE_ENV=production
LOG_LEVEL=info
ENABLE_METRICS=true
```

### **Firestore**
```bash
# Crear índices compuestos
gcloud firestore indexes composite create \
  --collection-group=workouts \
  --query-scope=COLLECTION \
  --field-config=field-path=userId,order=ASCENDING \
  --field-config=field-path=createdAt,order=DESCENDING
```

### **Storage**
```bash
# Crear bucket para archivos
gsutil mb gs://somos-fitness-files
gsutil iam ch allUsers:objectViewer gs://somos-fitness-files
```

## 🐛 Troubleshooting

### **Errores Comunes**

#### **Error de autenticación**
```bash
# Verificar service account
gcloud auth activate-service-account --key-file=credentials/service-account-key.json
```

#### **Error de Firestore**
```bash
# Verificar reglas de Firestore
gcloud firestore rules get
```

#### **Error de deployment**
```bash
# Ver logs de deployment
gcloud app logs read --limit=50
```

### **Debugging**
```bash
# Logs en tiempo real
gcloud app logs tail

# Ver configuración
gcloud app describe

# Ver variables de entorno
gcloud app describe --format="value(envVariables)"
```

## 📚 Documentación Adicional

### **APIs de Google Cloud**
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Google AI Platform](https://cloud.google.com/ai-platform)
- [Cloud Run](https://cloud.google.com/run)
- [App Engine](https://cloud.google.com/appengine)

### **Express.js**
- [Express Documentation](https://expressjs.com/)
- [JWT](https://jwt.io/)
- [Winston](https://github.com/winstonjs/winston)

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Marcela** - *Desarrollo inicial* - [TuGitHub](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Google Cloud Platform por la infraestructura
- Express.js por el framework
- Winston por el sistema de logging
- La comunidad de Node.js 