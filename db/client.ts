import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'brewlab.db';

// enableChangeListener powers Drizzle's useLiveQuery (auto re-render on writes).
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });
export type DB = typeof db;

export { schema };
