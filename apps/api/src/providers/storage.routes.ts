import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware, requireRole } from '../auth/middleware.js';
import {
  uploadFile,
  deleteFile,
  generateFilePath,
  validateImageFile,
  STORAGE_BUCKETS,
  initializeBuckets,
} from './storage.provider.js';

interface UploadQuery {
  produto_id?: string;
}

interface DeleteQuery {
  path: string;
}

interface MultipleUploadQuery {
  produto_id?: string;
}

export async function storageRoutes(app: FastifyInstance): Promise<void> {
  await initializeBuckets();

  app.post(
    '/admin/upload/product-image',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR', 'OPERADOR')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const data = await request.file({
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
        },
      });

      if (!data) {
        return reply.code(400).send({ error: 'Nenhum arquivo enviado' });
      }

      const validation = validateImageFile(await data.toBuffer(), data.mimetype);
      if (!validation.valid) {
        return reply.code(400).send({ error: validation.error });
      }

      const query = request.query as { produto_id?: string };
      const produtoId = query?.produto_id;
      const path = generateFilePath(STORAGE_BUCKETS.PRODUCT_IMAGES, data.filename, produtoId);

      try {
        const buffer = await data.toBuffer();
        const result = await uploadFile({
          bucket: STORAGE_BUCKETS.PRODUCT_IMAGES,
          path,
          file: buffer,
          contentType: data.mimetype,
        });

        return reply.send({
          url: result.publicUrl,
          path: result.path,
          fullPath: result.fullPath,
          filename: data.filename,
          mimetype: data.mimetype,
          size: buffer.length,
        });
      } catch (error) {
        console.error('Upload error:', error);
        return reply.code(500).send({ error: 'Erro ao fazer upload da imagem' });
      }
    }
  );

  app.delete(
    '/admin/upload/product-image',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: {
        querystring: {
          type: 'object',
          required: ['path'],
          properties: {
            path: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object', properties: { message: { type: 'string' } } },
          400: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { path: string };
      const { path } = query;

      if (!path) {
        return reply.code(400).send({ error: 'Path é obrigatório' });
      }

      try {
        await deleteFile(STORAGE_BUCKETS.PRODUCT_IMAGES, path);
        return reply.send({ message: 'Imagem removida com sucesso' });
      } catch (error) {
        console.error('Delete error:', error);
        return reply.code(500).send({ error: 'Erro ao remover imagem' });
      }
    }
  );

  app.post(
    '/admin/upload/multiple-product-images',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR', 'OPERADOR')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const query = request.query as { produto_id?: string };
      const produtoId = query?.produto_id;
      const files: { filename: string; mimetype: string; buffer: Buffer }[] = [];

      for await (const part of request.files()) {
        const validation = validateImageFile(await part.toBuffer(), part.mimetype);
        if (!validation.valid) {
          return reply.code(400).send({ error: validation.error });
        }
        files.push({
          filename: part.filename,
          mimetype: part.mimetype,
          buffer: await part.toBuffer(),
        });
      }

      if (files.length === 0) {
        return reply.code(400).send({ error: 'Nenhum arquivo enviado' });
      }

      try {
        const results = await Promise.all(
          files.map(async (file) => {
            const path = generateFilePath(STORAGE_BUCKETS.PRODUCT_IMAGES, file.filename, produtoId);
            const result = await uploadFile({
              bucket: STORAGE_BUCKETS.PRODUCT_IMAGES,
              path,
              file: file.buffer,
              contentType: file.mimetype,
            });
            return {
              url: result.publicUrl,
              path: result.path,
              fullPath: result.fullPath,
              filename: file.filename,
              mimetype: file.mimetype,
              size: file.buffer.length,
            };
          })
        );

        return reply.send({ images: results });
      } catch (error) {
        console.error('Multiple upload error:', error);
        return reply.code(500).send({ error: 'Erro ao fazer upload das imagens' });
      }
    }
  );
}