const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  generatePDFReport
} = require('../controllers/taskController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// All task routes require authentication
router.use(isAuthenticated);

// GET /api/tasks - Get all tasks with search and sort
router.get('/', getAllTasks);

// GET /api/tasks/:id - Get single task
router.get('/:id', getTaskById);

// POST /api/tasks - Create new task
router.post('/', createTask);

// PUT /api/tasks/:id - Update task
router.put('/:id', updateTask);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', deleteTask);

// GET /api/tasks/report/pdf - Generate PDF report
router.get('/report/pdf', generatePDFReport);

module.exports = router;
