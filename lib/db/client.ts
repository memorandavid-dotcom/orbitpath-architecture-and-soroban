import * as schema from './schema';

// Simple mock database object for development
// In production, this would be connected to real database via Neon
export const db: any = null;

export async function checkDatabase() {
  console.log('[OrbitPath] Database not configured - running in mock mode');
  return false;
}
