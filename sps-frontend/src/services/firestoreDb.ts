import { firebaseAdapter } from "./adapters/firebaseAdapter";
import { localAdapter } from "./adapters/localAdapter";
import { IDataService } from "./IDataService";

const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE || "firebase";

console.log(`[DataService] Initialized with source: ${DATA_SOURCE}`);

export const firestoreDb: IDataService = DATA_SOURCE === 'local' ? localAdapter : firebaseAdapter;
