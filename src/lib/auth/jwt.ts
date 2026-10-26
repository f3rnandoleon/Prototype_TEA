import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@/types';

const SECRET_STR = process.env.JWT_SECRET || 'dev_jwt_secret_key_at_least_32_characters_long_for_security_checks_12345';
const SECRET_KEY = new TextEncoder().encode(SECRET_STR);

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export async function signJWT(payload: TokenPayload, expiresIn = '7d'): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}
