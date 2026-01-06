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

// --- UNITS ---

app.get('/api/units', async (req, res) => {
    try {
        const units = await prisma.unit.findMany();
        res.json(units);
    } catch (e) { handleError(res, e, 'Failed to fetch units'); }
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

// --- PROJECTS ---

app.get('/api/projects', async (req, res) => {
    try {
        const projects = await prisma.project.findMany();
        res.json(projects);
    } catch (e) { handleError(res, e, 'Failed to fetch projects'); }
});

app.get('/api/programs/:programId/projects', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: { programId: req.params.programId }
        });
        res.json(projects);
    } catch (e) { handleError(res, e, 'Failed to fetch program projects'); }
});

app.post('/api/projects', async (req, res) => {
    try {
        const project = await prisma.project.create({ data: req.body });
        res.json(project);
    } catch (e) { handleError(res, e, 'Failed to create project'); }
});

app.put('/api/projects/:id', async (req, res) => {
    try {
        const project = await prisma.project.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(project);
    } catch (e) { handleError(res, e, 'Failed to update project'); }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        await prisma.project.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e, 'Failed to delete project'); }
});

app.get('/api/projects/:projectId/actions', async (req, res) => {
    try {
        const actions = await prisma.action.findMany({
            where: { projectId: req.params.projectId }
        });
        res.json(actions);
    } catch (e) { handleError(res, e, 'Failed to fetch project actions'); }
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

// --- DELIVERABLES ---

app.get('/api/actions/:actionId/deliverables', async (req, res) => {
    try {
        const deliverables = await prisma.deliverable.findMany({
            where: { actionId: req.params.actionId }
        });
        res.json(deliverables);
    } catch (e) { handleError(res, e, 'Failed to fetch deliverables'); }
});

app.post('/api/deliverables', async (req, res) => {
    try {
        const deliverable = await prisma.deliverable.create({ data: req.body });
        res.json(deliverable);
    } catch (e) { handleError(res, e, 'Failed to create deliverable'); }
});

app.delete('/api/deliverables/:id', async (req, res) => {
    try {
        await prisma.deliverable.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e, 'Failed to delete deliverable'); }
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

app.delete('/api/indicators/:id', async (req, res) => {
    try {
        await prisma.indicator.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e, 'Failed to delete indicator'); }
});

app.put('/api/indicators/:id', async (req, res) => {
    try {
        const indicator = await prisma.indicator.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(indicator);
    } catch (e) { handleError(res, e, 'Failed to update indicator'); }
});

// --- RISKS ---

app.get('/api/programs/:programId/risks', async (req, res) => {
    try {
        const risks = await prisma.risk.findMany({
            where: { programId: req.params.programId }
        });
        res.json(risks);
    } catch (e) { handleError(res, e, 'Failed to fetch risks'); }
});

app.post('/api/risks', async (req, res) => {
    try {
        const risk = await prisma.risk.create({ data: req.body });
        res.json(risk);
    } catch (e) { handleError(res, e, 'Failed to create risk'); }
});

app.delete('/api/risks/:id', async (req, res) => {
    try {
        await prisma.risk.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e, 'Failed to delete risk'); }
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

// --- EVIDENCES ---

app.get('/api/evidences', async (req, res) => {
    try {
        const evidences = await prisma.evidence.findMany({
            include: { action: { include: { program: { include: { unit: true } } } } }
        });
        res.json(evidences);
    } catch (e) { handleError(res, e, 'Failed to fetch all evidences'); }
});

app.get('/api/actions/:actionId/evidences', async (req, res) => {
    try {
        const evidences = await prisma.evidence.findMany({
            where: { actionId: req.params.actionId }
        });
        res.json(evidences);
    } catch (e) { handleError(res, e, 'Failed to fetch evidences'); }
});

app.post('/api/evidences', async (req, res) => {
    try {
        const evidence = await prisma.evidence.create({ data: req.body });
        res.json(evidence);
    } catch (e) { handleError(res, e, 'Failed to create evidence'); }
});

app.delete('/api/evidences/:id', async (req, res) => {
    try {
        await prisma.evidence.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e, 'Failed to delete evidence'); }
});

// --- USERS ---

app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (e) { handleError(res, e, 'Failed to fetch users'); }
});

app.get('/api/users/:uid', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { uid: req.params.uid }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (e) { handleError(res, e, 'Failed to fetch user'); }
});

app.post('/api/users', async (req, res) => {
    try {
        const user = await prisma.user.upsert({
            where: { uid: req.body.uid },
            update: req.body,
            create: req.body
        });
        res.json(user);
    } catch (e) { handleError(res, e, 'Failed to save user'); }
});

app.delete('/api/users/:uid', async (req, res) => {
    try {
        await prisma.user.delete({ where: { uid: req.params.uid } });
        res.json({ success: true });
    } catch (e) { handleError(res, e, 'Failed to delete user'); }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
