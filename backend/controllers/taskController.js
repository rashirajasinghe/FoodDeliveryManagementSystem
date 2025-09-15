const Task = require('../models/Task');

// Get all tasks with search and sort functionality
const getAllTasks = async (req, res) => {
  try {
    const { search, sortBy, sortOrder, status } = req.query;
    
    let query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { assignedTo: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add sorting
    let sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by creation date
    }
    
    const tasks = await Task.find(query).sort(sortOptions);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const { title, description, deadline, assignedTo, status } = req.body;
    
    const task = new Task({
      title,
      description,
      deadline,
      assignedTo,
      status: status || 'pending',
      createdBy: req.user.email
    });
    
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    const { title, description, deadline, assignedTo, status } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.title = title || task.title;
    task.description = description || task.description;
    task.deadline = deadline || task.deadline;
    task.assignedTo = assignedTo || task.assignedTo;
    task.status = status || task.status;
    task.updatedAt = new Date();
    
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate PDF report
const generatePDFReport = async (req, res) => {
  try {
    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');
    
    const tasks = await Task.find().sort({ createdAt: -1 });
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Task Management Report', 14, 22);
    
    // Add generation date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
    // Prepare table data
    const tableData = tasks.map(task => [
      task.title,
      task.description.substring(0, 50) + (task.description.length > 50 ? '...' : ''),
      task.assignedTo,
      task.status,
      new Date(task.deadline).toLocaleDateString(),
      new Date(task.createdAt).toLocaleDateString()
    ]);
    
    // Add table
    doc.autoTable({
      head: [['Title', 'Description', 'Assigned To', 'Status', 'Deadline', 'Created']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=task-report.pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  generatePDFReport
};
