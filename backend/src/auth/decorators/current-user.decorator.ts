import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export interface CurrentUserData {
  id: number;
  email: string;
  role: string;
}

interface RequestWithSession {
  session: Record<string, unknown>;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest<RequestWithSession>();
    const { session } = request;

    if (
      typeof session?.userId !== 'number' ||
      typeof session?.email !== 'string' ||
      typeof session?.role !== 'string'
    ) {
      throw new UnauthorizedException();
    }

    return {
      id: session.userId,
      email: session.email,
      role: session.role,
    };
  },
);
