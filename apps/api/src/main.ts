import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { config } from 'dotenv';
import Fastify from 'fastify';
import { adminRoutes } from './admin/routes.js';
import { adminCategoryRoutes } from './categories/admin.routes.js';
import { registerAuthMiddleware } from './auth/middleware.js';
import { authRoutes } from './auth/routes.js';
import { cartRoutes } from './cart/routes.js';
import { categoryRoutes } from './categories/routes.js';
import { checkoutRoutes } from './checkout/routes.js';
import { adminOrderRoutes } from './orders/admin.routes.js';
import { orderRoutes } from './orders/routes.js';
import { adminProductRoutes } from './products/admin.routes.js';
import { productRoutes } from './products/routes.js';
import { storageRoutes } from './providers/storage.routes.js';
import { webhookRoutes } from './webhooks/routes.js';

config();

const app = Fastify({
  logger: true,
});

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

  await app.register(adminRoutes, { prefix: '/api/v1' });
  await app.register(categoryRoutes, { prefix: '/api/v1' });
  await app.register(adminCategoryRoutes, { prefix: '/api/v1' });
  await app.register(productRoutes, { prefix: '/api/v1' });
  await app.register(adminProductRoutes, { prefix: '/api/v1' });
  await app.register(cartRoutes, { prefix: '/api/v1' });
  await app.register(checkoutRoutes, { prefix: '/api/v1' });
  await app.register(orderRoutes, { prefix: '/api/v1' });
  await app.register(adminOrderRoutes, { prefix: '/api/v1' });
  await app.register(storageRoutes, { prefix: '/api/v1' });
  await app.register(webhookRoutes, { prefix: '/api/v1' });

  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📚 Swagger UI available at http://localhost:${port}/docs`);
}

initialize().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
