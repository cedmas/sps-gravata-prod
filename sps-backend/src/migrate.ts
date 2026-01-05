// scripts/migrate.ts
// Usar: npx ts-node-dev src/migrate.ts

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
    apiKey: "AIzaSyAU1SlcJKQotg2gQDi9RqfKl6-iupyvgKI",
    authDomain: "sps-gravata-prod.firebaseapp.com",
    projectId: "sps-gravata-prod",
    storageBucket: "sps-gravata-prod.firebasestorage.app",
    messagingSenderId: "981478653532",
    appId: "1:981478653532:web:8c5e72f33519592aea7099"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const prisma = new PrismaClient();

async function migrate() {
    console.log("🚀 Starting migration from Firebase to Postgres...");

    try {
        // --- UNITS ---
        console.log("\n📦 Migrating UNITS...");
        const unitsSnap = await getDocs(collection(db, "units"));
        for (const doc of unitsSnap.docs) {
            const data = doc.data();
            await prisma.unit.create({
                data: {
                    id: doc.id,
                    name: data.name,
                    acronym: data.acronym || data.name.substring(0, 3).toUpperCase()
                }
            });
            console.log(`   + Unit: ${data.name}`);
        }

        // --- AXES ---
        // (Assuming axes are static in local but might be in firebase, let's create static ones if empty)
        console.log("\n📐 Ensures AXES exist...");
        const axes = [
            { id: '1', name: 'Gestão e Governança', color: 'blue' },
            { id: '2', name: 'Desenvolvimento Social', color: 'green' },
            { id: '3', name: 'Infraestrutura e Urbanismo', color: 'gray' },
        ];
        for (const axis of axes) {
            const exists = await prisma.axis.findUnique({ where: { id: axis.id } });
            if (!exists) {
                await prisma.axis.create({ data: axis });
            }
        }

        // --- PROGRAMS ---
        console.log("\n🎯 Migrating PROGRAMS...");
        const progSnap = await getDocs(collection(db, "programs"));
        for (const doc of progSnap.docs) {
            const data = doc.data();

            // Check if unit/axis exists (integrity)
            const unitExists = await prisma.unit.findUnique({ where: { id: data.unitId } });
            if (!unitExists) {
                console.warn(`   ⚠️ Skipping Program ${data.name}: Unit ${data.unitId} not found.`);
                continue;
            }

            await prisma.program.create({
                data: {
                    id: doc.id,
                    name: data.name,
                    objective: data.objective || "",
                    publicProblem: data.publicProblem || "",
                    targetAudience: data.targetAudience || "",
                    unitId: data.unitId,
                    axisId: data.axisId || "1" // Default to 1 if missing
                }
            });
            console.log(`   + Program: ${data.name}`);
        }

        // --- ACTIONS ---
        console.log("\n⚡ Migrating ACTIONS...");
        const actSnap = await getDocs(collection(db, "actions"));
        for (const doc of actSnap.docs) {
            const data = doc.data();

            // Check parent program
            const progExists = await prisma.program.findUnique({ where: { id: data.programId } });
            if (!progExists) {
                console.warn(`   ⚠️ Skipping Action ${data.name}: Program ${data.programId} not found.`);
                continue;
            }

            await prisma.action.create({
                data: {
                    id: doc.id,
                    programId: data.programId,
                    name: data.name,
                    responsible: data.responsible || "Não informado",
                    startDate: new Date(), // Mock date if missing, or parse data.startDate
                    endDate: new Date(),   // Mock date
                    status: data.status || "not_started",
                    weight: Number(data.weight) || 1
                }
            });
            console.log(`   + Action: ${data.name}`);
        }

        // --- INDICATORS ---
        console.log("\n📊 Migrating INDICATORS...");
        const indSnap = await getDocs(collection(db, "indicators"));
        for (const doc of indSnap.docs) {
            const data = doc.data();
            const progExists = await prisma.program.findUnique({ where: { id: data.programId } });
            if (!progExists) continue;

            await prisma.indicator.create({
                data: {
                    id: doc.id,
                    programId: data.programId,
                    name: data.name,
                    description: data.description || "",
                    baseline: Number(data.baseline) || 0,
                    target: Number(data.target) || 0,
                    unit: data.unit || "un"
                }
            });
            console.log(`   + Indicator: ${data.name}`);
        }

        console.log("\n✅ Migration Completed Successfully!");

    } catch (e) {
        console.error("\n❌ Migration Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
