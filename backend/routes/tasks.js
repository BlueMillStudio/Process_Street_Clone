const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const validateTask = require('../utils/taskValidator');

console.log('Registering task routes, including subtask creation route');
function formatDate(date) {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'object' && date.toDate instanceof Function) return date.toDate().toISOString();
    if (typeof date === 'string') {
        const parsedDate = new Date(date);
        return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
    }
    return null;
}

// Add this new route for creating subtasks
router.post('/:id/subtasks', async (req, res, next) => {
    console.log('Received POST request to create subtask:', req.params.id, req.body);
    try {
        const { id } = req.params;
        const { title, status } = req.body;

        const taskRef = db.collection('tasks').doc(id);
        const task = await taskRef.get();

        if (!task.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const newSubtask = {
            id: Date.now().toString(), // Use current timestamp as ID
            title,
            status: status || 'pending'
        };

        console.log('New subtask object:', newSubtask);

        const currentSubtasks = task.data().subtasks || [];
        const updatedSubtasks = [...currentSubtasks, newSubtask];

        console.log('Updated subtasks array:', updatedSubtasks);

        await taskRef.update({ subtasks: updatedSubtasks });

        const updatedTask = await taskRef.get();
        res.status(201).json({ id: updatedTask.id, ...updatedTask.data() });
    } catch (error) {
        console.error('Error creating subtask:', error);
        res.status(500).json({
            message: 'Error creating subtask',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
});

// Get all tasks
router.get('/', async (req, res) => {
    try {
        let query = db.collection('tasks').orderBy('createdAt', 'desc');

        if (req.query.workflowId) {
            query = query.where('workflowId', '==', req.query.workflowId);
        }

        const tasksSnapshot = await query.get();
        const tasks = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            message: 'Error fetching tasks',
            error: error.message
        });
    }
});

// Create a new task
// Update your create task route
router.post('/', async (req, res, next) => {
    console.log('Received POST request to create task:', JSON.stringify(req.body, null, 2));
    try {
        const taskData = req.body;
        validateTask(taskData);

        const task = {
            ...taskData,
            status: taskData.status || 'pending',
            priority: taskData.priority || 'medium',
            dueDate: formatDate(taskData.dueDate),
            assignees: taskData.assignees || [],
            tags: taskData.tags || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            subtasks: taskData.subtasks || []
        };

        console.log('Task object before saving:', JSON.stringify(task, null, 2));

        const docRef = await db.collection('tasks').add(task);
        const savedTask = { id: docRef.id, ...task };
        console.log('Task created successfully:', JSON.stringify(savedTask, null, 2));
        res.status(201).json(savedTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            message: 'Error creating task',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
});


// Update a task
router.put('/:id', async (req, res, next) => {
    console.log('Received PUT request to update task:', req.params.id, req.body);
    try {
        const { id } = req.params;
        const updateData = req.body;
        validateTask(updateData);

        const taskRef = db.collection('tasks').doc(id);
        const task = await taskRef.get();

        if (!task.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await taskRef.update(updateData);

        const updatedTask = await taskRef.get();
        res.json({ id, ...updatedTask.data() });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            message: 'Error updating task',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
});

// Delete a task
router.delete('/:id', async (req, res, next) => {
    console.log('Received DELETE request for task:', req.params.id);
    try {
        const { id } = req.params;
        const taskRef = db.collection('tasks').doc(id);
        const task = await taskRef.get();

        if (!task.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await taskRef.delete();
        res.json({ message: 'Task deleted successfully', id });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            message: 'Error deleting task',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
});
// Update subtask status
router.patch('/:taskId/subtasks/:subtaskId', async (req, res, next) => {
    console.log('Received PATCH request for subtask:', req.params.taskId, req.params.subtaskId, req.body);
    try {
        const { taskId, subtaskId } = req.params;
        const { status } = req.body;

        const taskRef = db.collection('tasks').doc(taskId);
        const task = await taskRef.get();

        if (!task.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const taskData = task.data();
        const updatedSubtasks = taskData.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, status } : subtask
        );

        await taskRef.update({ subtasks: updatedSubtasks });

        const updatedTask = await taskRef.get();
        res.json({ id: taskId, ...updatedTask.data() });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({
            message: 'Error updating subtask',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
});

// Delete subtask
router.delete('/:taskId/subtasks/:subtaskId', async (req, res, next) => {
    console.log('Received DELETE request for subtask:', req.params.taskId, req.params.subtaskId);
    try {
        const { taskId, subtaskId } = req.params;

        const taskRef = db.collection('tasks').doc(taskId);
        const task = await taskRef.get();

        if (!task.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const taskData = task.data();
        const updatedSubtasks = taskData.subtasks.filter(subtask => subtask.id !== subtaskId);

        await taskRef.update({ subtasks: updatedSubtasks });

        const updatedTask = await taskRef.get();
        res.json({ id: taskId, ...updatedTask.data() });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({
            message: 'Error deleting subtask',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
});
console.log('All routes registered');

module.exports = router;