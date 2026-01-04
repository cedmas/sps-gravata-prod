import { firestoreDb } from './firestoreDb';
import { db } from './firebase';
import { writeBatch, doc } from 'firebase/firestore';

export const automationService = {
    async runStatusAutomation() {
        // Logic:
        // 1. Get all actions
        // 2. updates: Delayed (End < Today && Status != Completed/Cancelled)
        // 3. updates: In Progress (End >= Today && Status == Delayed) - Auto-correction

        console.log("Running Status Automation...");
        try {
            const actions = await firestoreDb.getAllActions();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const batch = writeBatch(db);
            let updateCount = 0;

            actions.forEach(action => {
                if (!action.endDate) return;

                const endDate = new Date(action.endDate);
                endDate.setHours(0, 0, 0, 0); // Compare dates only

                // Rule 1: Detect Delay
                // If Today > EndDate AND Status is NOT Completed/Cancelled/Delayed -> Set Delayed
                if (today > endDate) {
                    if (action.status !== 'completed' && action.status !== 'delayed') {
                        const ref = doc(db, 'actions', action.id);
                        batch.update(ref, { status: 'delayed' });
                        updateCount++;
                        console.log(`Auto-tagging [DELAYED]: ${action.name}`);
                    }
                }

                // Rule 2: Auto-Correct (If user extended the date)
                // If Today <= EndDate AND Status IS Delayed -> Set In Progress
                if (today <= endDate && action.status === 'delayed') {
                    const ref = doc(db, 'actions', action.id);
                    batch.update(ref, { status: 'in_progress' });
                    updateCount++;
                    console.log(`Auto-correcting [IN PROGRESS]: ${action.name}`);
                }
            });

            if (updateCount > 0) {
                await batch.commit();
                console.log(`Automation complete. Updated ${updateCount} actions.`);
            } else {
                console.log("Automation complete. No updates needed.");
            }

        } catch (error) {
            console.error("Error running automation:", error);
        }
    }
};
