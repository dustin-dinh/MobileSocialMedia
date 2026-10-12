import { Module } from '@nestjs/common';

import {
    AdminController,
    AdminGuard,
    AdminPageController,
} from './admin.controller';
import { AdminService } from './admin.service';

@Module({
    controllers: [AdminPageController, AdminController],
    providers: [AdminService, AdminGuard],
})
export class AdminModule { }
