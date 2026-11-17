import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ method: string; originalUrl: string; id?: string }>();
    const res = http.getResponse<{ statusCode: number }>();
    const started = Date.now();
    const path = req.originalUrl.split('?')[0];
    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${req.method} ${path} ${res.statusCode} ${Date.now() - started}ms [${req.id}]`),
        error: () => this.logger.warn(`${req.method} ${path} failed ${Date.now() - started}ms [${req.id}]`),
      }),
    );
  }
}
