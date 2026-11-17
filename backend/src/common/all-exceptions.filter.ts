import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

// One error shape for the whole API: { statusCode, error }
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Server error. Please try again.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as string | { message?: string | string[] };
      const raw = typeof body === 'string' ? body : body.message;
      message = Array.isArray(raw) ? raw[0] : raw || exception.message;
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    if (status === 429) message = 'Too many requests. Please try again a little later.';
    res.status(status).json({ statusCode: status, error: message });
  }
}
