const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

router.post('/', async (req, res) => {
    try {
        const { name, description, tasks } = req.body;
        const newWorkflow = {
            name,
            description,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const workflowRef = await db.collection('workflows').add(newWorkflow);

        const taskPromises = tasks.map(task => {
            const newTask = {
                title: task.title,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                workflowId: workflowRef.id
            };
            return db.collection('tasks').add(newTask);
        });

        await Promise.all(taskPromises);

        const savedWorkflow = { id: workflowRef.id, ...newWorkflow };
        res.status(201).json(savedWorkflow);
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({
            message: 'Error creating workflow',
            error: error.message
        });
    }
});

// Get all workflows (unchanged)
router.get('/', async (req, res) => {
    try {
        const workflowsSnapshot = await db.collection('workflows').orderBy('createdAt', 'desc').get();
        const workflows = workflowsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
            };
        });
        res.json(workflows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({
            message: 'Error fetching workflows',
            error: error.message
        });
    }
});

module.exports = router;