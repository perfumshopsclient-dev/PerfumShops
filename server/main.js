import 'dotenv/config'
import express from 'express'
import { iniciarJobExpiracion } from './jobs/expirarPedidos.js'
import { sequelize } from './db/database.js'
import { User } from './models/User.js'
import { Perfume } from './models/Perfume.js'
import { createUsersRouter } from './routes/users_routes.js'
import { createPerfumesRouter, createAcordesRouter } from './routes/perfumes_routes.js'
import { createVentasRouter } from './routes/ventas_router.js'
import './models/Associations.js';
import './models/Acorde.js';
import { corsMiddleware } from './middlewares/cors.js'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import pedidosRoutes from './routes/pedidos.routes.js'
import helmet from 'helmet'
import { errorHandler, notFound } from './middlewares/errorHandler.js'

const app = express()
app.use(corsMiddleware())

app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.disable('x-powered-by') // Desactiva la cabecera X-Powered-By

// Healthcheck para el hosting: va ANTES del limitador para que nunca se bloquee
app.get('/health', (_req, res) => res.json({ ok: true }))

// Limitador global suave (el conteo vive en memoria: con 2+ instancias necesitarás un almacén compartido)
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
}))

app.use('/users', createUsersRouter({ userModel: User }));
app.use('/perfumes', createPerfumesRouter({ perfumeModel: Perfume, userModel: User }));
app.use('/acordes', createAcordesRouter());


app.use('/pedidos', pedidosRoutes);

app.use('/ventas', createVentasRouter({ userModel: User }))

// Siempre al final: 404 en JSON y manejador global de errores
app.use(notFound)
app.use(errorHandler)

console.log('Arrancando... PORT =', process.env.PORT, '| NODE_ENV =', process.env.NODE_ENV)

const PORT = process.env.PORT || 3000

console.log('Conectando a la BD en', process.env.DB_HOST, process.env.DB_PORT)
sequelize.authenticate()
  .then(() => {
    console.log('Conexión a la BD verificada')
    iniciarJobExpiracion()
    app.listen(PORT, '0.0.0.0', () => console.log('Servidor corriendo en el puerto', PORT))
  })
  .catch(err => {
    console.error('No se pudo conectar a la BD:', err)
    process.exit(1)
  })