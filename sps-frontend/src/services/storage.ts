import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const storageService = {
    async uploadEvidence(file: File, path: string = 'evidences'): Promise<string> {
        try {
            const timestamp = Date.now();
            const storageRef = ref(storage, `${path}/${timestamp}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    }
};
