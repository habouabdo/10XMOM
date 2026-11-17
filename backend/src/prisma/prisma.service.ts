import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// The only place that opens a database connection. Everything else goes through this service.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      new Logger('Database').error(`Cannot connect to MySQL. Check DATABASE_URL in backend/.env and that MySQL is running. (${(err as Error).message.split('\n').pop()?.trim()})`);
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
