import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper for error handling
const handleError = (res: any, error: any, msg: string) => {
    console.error(msg, error);
    res.status(500).json({ error: msg, details: error.message });
}

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// --- PROGRAMS ---

app.get('/api/programs', async (req, res) => {
    try {
        const programs = await prisma.program.findMany();
        res.json(programs);
    } catch (e) { handleError(res, e, 'Failed to fetch programs'); }
});

app.post('/api/programs', async (req, res) => {
    try {
        const program = await prisma.program.create({ data: req.body });
        res.json(program);
    } catch (e) { handleError(res, e, 'Failed to create program'); }
});

app.put('/api/programs/:id', async (req, res) => {
    try {
        const program = await prisma.program.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(program);
    } catch (e) { handleError(res, e, 'Failed to update program'); }
});

app.delete('/api/programs/:id', async (req, res) => {
    try {
        await prisma.program.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e, 'Failed to delete program'); }
});

// --- ACTIONS ---

app.get('/api/actions', async (req, res) => {
    try {
        const actions = await prisma.action.findMany();
        res.json(actions);
    } catch (e) { handleError(res, e, 'Failed to fetch actions'); }
});

app.get('/api/programs/:programId/actions', async (req, res) => {
    try {
        const actions = await prisma.action.findMany({
            where: { programId: req.params.programId }
        });
        res.json(actions);
    } catch (e) { handleError(res, e, 'Failed to fetch program actions'); }
});

app.post('/api/actions', async (req, res) => {
    try {
        const action = await prisma.action.create({ data: req.body });
        res.json(action);
    } catch (e) { handleError(res, e, 'Failed to create action'); }
});

app.put('/api/actions/:id', async (req, res) => {
    try {
        const action = await prisma.action.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(action);
    } catch (e) { handleError(res, e, 'Failed to update action'); }
});

app.delete('/api/actions/:id', async (req, res) => {
    try {
        await prisma.action.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e, 'Failed to delete action'); }
});

// --- INDICATORS ---

app.get('/api/programs/:programId/indicators', async (req, res) => {
    try {
        const indicators = await prisma.indicator.findMany({
            where: { programId: req.params.programId }
        });
        res.json(indicators);
    } catch (e) { handleError(res, e, 'Failed to fetch indicators'); }
});

app.post('/api/indicators', async (req, res) => {
    try {
        const indicator = await prisma.indicator.create({ data: req.body });
        res.json(indicator);
    } catch (e) { handleError(res, e, 'Failed to create indicator'); }
});

// --- SETTINGS ---

app.get('/api/settings', async (req, res) => {
    try {
        const settings = await prisma.settings.findUnique({
            where: { id: 'global' }
        });
        res.json(settings || {});
    } catch (e) { handleError(res, e, 'Failed to fetch settings'); }
});

app.post('/api/settings', async (req, res) => {
    try {
        const settings = await prisma.settings.upsert({
            where: { id: 'global' },
            update: { geminiApiKey: req.body.geminiApiKey },
            create: { id: 'global', geminiApiKey: req.body.geminiApiKey }
        });
        res.json(settings);
    } catch (e) { handleError(res, e, 'Failed to save settings'); }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
