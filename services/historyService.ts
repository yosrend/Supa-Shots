import { openDB, DBSchema } from 'idb';
import { ProjectHistory } from '../types';

interface SupaShotsDB extends DBSchema {
  projects: {
    key: string;
    value: ProjectHistory;
    indexes: { 'by-date': number };
  };
}

const DB_NAME = 'supashots-db';
const STORE_NAME = 'projects';

export const initDB = async () => {
  return openDB<SupaShotsDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('by-date', 'timestamp');
    },
  });
};

export const saveProject = async (project: ProjectHistory) => {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, project);
    console.log('Project saved to history:', project.id);
  } catch (error) {
    console.error('Failed to save project:', error);
  }
};

export const getAllProjects = async (): Promise<ProjectHistory[]> => {
  try {
    const db = await initDB();
    // Return sorted by timestamp descending (newest first)
    const projects = await db.getAllFromIndex(STORE_NAME, 'by-date');
    return projects.reverse();
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return [];
  }
};

export const deleteProject = async (id: string) => {
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
};