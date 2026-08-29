import { config } from 'dotenv';
config();

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import * as Sentry from '@sentry/node';
import Fastify, { type FastifyError } from 'fastify';
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { adminRoutes } from './admin/routes.js';
import { registerAuthMiddleware } from './auth/middleware.js';
import { authRoutes } from './auth/routes.js';
import { cartRoutes } from './cart/routes.js';
import { adminCategoryRoutes } from './categories/admin.routes.js';
import { categoryRoutes } from './categories/routes.js';
import { checkoutRoutes } from './checkout/routes.js';
import { clientRoutes } from './client/routes.js';
import { prisma } from './lib/prisma.js';
import { adminOrderRoutes } from './orders/admin.routes.js';
import { orderRoutes } from './orders/routes.js';
import { adminProductRoutes } from './products/admin.routes.js';
import { productRoutes } from './products/routes.js';
import { storageRoutes } from './providers/storage.routes.js';
import { stockRoutes } from './stock/routes.js';
import { webhookRoutes } from './webhooks/routes.js';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: Boolean(process.env.SENTRY_DSN),
});

const app = Fastify({
  logger: true,
});

app.setErrorHandler((error: FastifyError, _request, reply) => {
  Sentry.captureException(error);
  reply.status(error.statusCode || 500).send({ error: error.message });
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.withTypeProvider<ZodTypeProvider>();

async function initialize() {
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'dev-cookie-secret',
    hook: 'onRequest',
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'NextCommerce API',
        description: 'SaaS de e-commerce para pequenos lojistas',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  await registerAuthMiddleware(app);

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.get('/ready', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch (error) {
      app.log.error({ err: error }, 'Readiness check failed');
      throw error;
    }
  });

  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(adminRoutes, { prefix: '/api/v1' });
  await app.register(categoryRoutes, { prefix: '/api/v1' });
  await app.register(adminCategoryRoutes, { prefix: '/api/v1' });
  await app.register(productRoutes, { prefix: '/api/v1' });
  await app.register(adminProductRoutes, { prefix: '/api/v1' });
  await app.register(cartRoutes, { prefix: '/api/v1' });
  await app.register(checkoutRoutes, { prefix: '/api/v1' });
  await app.register(orderRoutes, { prefix: '/api/v1' });
  await app.register(adminOrderRoutes, { prefix: '/api/v1' });
  await app.register(stockRoutes, { prefix: '/api/v1' });
  await app.register(storageRoutes, { prefix: '/api/v1' });
  await app.register(webhookRoutes, { prefix: '/api/v1' });
  await app.register(clientRoutes, { prefix: '/api/v1' });

  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '::' });
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📚 Swagger UI available at http://localhost:${port}/docs`);
}

initialize().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
