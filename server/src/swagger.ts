import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupDocs(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('MseFunded API')
    .setDescription('Funded MSc and PhD places for materials science students, plus accounts and saved lists.')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();

  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));
}
