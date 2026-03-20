import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

interface RequestWithSession {
  session: Record<string, unknown>;
}

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const { session } = request;

    if (typeof session?.userId !== 'number') {
      throw new UnauthorizedException();
    }

    return true;
  }
}
