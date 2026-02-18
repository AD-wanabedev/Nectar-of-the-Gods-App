import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db as firestore, auth } from './firebase';

// Helper to get user's collection path
const getUserCollection = (collectionName) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    return collection(firestore, 'users', userId, collectionName);
};

// Helper to sync with Google Sheets
const syncToSheets = async (data, action) => {
    const sheetUrl = localStorage.getItem('nectar_sheet_url');
    if (!sheetUrl) return;

    try {
        // We use no-cors to avoid CORS errors with Google Apps Script
        await fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...data, action, timestamp: new Date().toISOString() })
        });
        console.log("Synced to Sheets:", action);
    } catch (error) {
        console.error("Sheets sync error:", error);
    }
};

// Leads operations
export const leadsDB = {
    async getAll() {
        const q = query(getUserCollection('leads'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async add(data) {
        const docRef = await addDoc(getUserCollection('leads'), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        syncToSheets({ id: docRef.id, ...data }, 'ADD');
        return docRef.id;
    },

    async update(id, data) {
        const docRef = doc(getUserCollection('leads'), id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
        syncToSheets({ id, ...data }, 'UPDATE');
    },

    async delete(id) {
        await deleteDoc(doc(getUserCollection('leads'), id));
        syncToSheets({ id }, 'DELETE');
    }
};

// Projects operations
export const projectsDB = {
    async getAll() {
        const snapshot = await getDocs(getUserCollection('projects'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async add(data) {
        const docRef = await addDoc(getUserCollection('projects'), {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async update(id, data) {
        await updateDoc(doc(getUserCollection('projects'), id), data);
    },

    async delete(id) {
        await deleteDoc(doc(getUserCollection('projects'), id));
    }
};

// Collateral operations (for Library)
export const collateralDB = {
    async getAll() {
        const snapshot = await getDocs(getUserCollection('collateral'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async add(data) {
        const docRef = await addDoc(getUserCollection('collateral'), {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async delete(id) {
        await deleteDoc(doc(getUserCollection('collateral'), id));
    }
};

// Legacy export for compatibility (temporary)
// Tasks operations
export const tasksDB = {
    async getAll() {
        const snapshot = await getDocs(getUserCollection('tasks'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async add(data) {
        const docRef = await addDoc(getUserCollection('tasks'), {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async update(id, data) {
        await updateDoc(doc(getUserCollection('tasks'), id), data);
    },

    async delete(id) {
        await deleteDoc(doc(getUserCollection('tasks'), id));
    }
};

// Documentation operations
export const documentationDB = {
    async getAll() {
        const q = query(getUserCollection('documentation'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async add(data) {
        const docRef = await addDoc(getUserCollection('documentation'), {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async update(id, data) {
        const docRef = doc(getUserCollection('documentation'), id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async delete(id) {
        await deleteDoc(doc(getUserCollection('documentation'), id));
    }
};

export const db = {
    leads: leadsDB,
    projects: projectsDB,
    tasks: tasksDB,
    collateral: collateralDB,
    documentation: documentationDB
};
