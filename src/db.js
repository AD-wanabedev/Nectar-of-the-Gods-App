import Dexie from 'dexie';

export const db = new Dexie('MoonshineDatabase');

db.version(1).stores({
    leads: '++id, name, phone, priority, nextFollowUp, status, teamMember',
    projects: '++id, name, status, priority',
    tasks: '++id, projectId, title, isDone, dueDate',
    collateral: '++id, title, type, folder, tags', // tags is array, indexed as multi-entry
});

export const resetDatabase = async () => {
    await db.delete();
    await db.open();
};
