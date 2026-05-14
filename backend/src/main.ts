import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('KanbanFlow API')
    .setVersion('0.0.1')
    .addCookieAuth('connect.sid', {
      type: 'apiKey',
      description: 'Session cookie — login first via POST /api/auth/login',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // --- Static file serving + SPA fallback ---
  const publicPath = join(__dirname, 'public');

  if (!require('fs').existsSync(publicPath)) {
    console.error(
      `[FATAL] No public/ folder found at ${publicPath}. ` +
        `Run the release build (npm run build:release) to include frontend assets.`,
    );
    process.exit(1);
  }

  app.use(express.static(publicPath));

  // SPA fallback: serve index.html for all non-API routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    // Don't interfere with actual static files — let express.static handle those first
    if (req.path.includes('.')) {
      return next();
    }
    res.sendFile(join(publicPath, 'index.html'));
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
