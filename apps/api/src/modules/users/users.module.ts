import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersController } from './users.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule { }
