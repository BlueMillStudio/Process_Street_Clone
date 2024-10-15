// utils/taskValidator.js
function validateTask(task) {
    const requiredFields = ['title'];
    const allowedStatuses = ['pending', 'in_progress', 'completed'];
    const allowedPriorities = ['low', 'medium', 'high'];

    for (let field of requiredFields) {
        if (!task[field]) {
            throw new Error(`${field} is required`);
        }
    }

    if (task.status && !allowedStatuses.includes(task.status)) {
        throw new Error(`Invalid status: ${task.status}`);
    }

    if (task.priority && !allowedPriorities.includes(task.priority)) {
        throw new Error(`Invalid priority: ${task.priority}`);
    }

    // Add more validations as needed

    return true;
}

module.exports = validateTask;