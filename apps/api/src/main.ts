import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Sau reverse proxy mọi request có cùng IP nếu không bật: giới hạn tần suất sẽ khóa tất cả người dùng.
  app.set("trust proxy", 1);

  const port = Number(process.env.PORT ?? 3000);

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port, "0.0.0.0");
}

void bootstrap();