const Task = require('../models/Task');

// @desc    Get all tasks (admin gets all, user gets assigned)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    let query = {};

    // Users only see their own tasks
    if (req.user.role === 'user') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Users can only view their own tasks
    if (req.user.role === 'user' && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, deadline } = req.body;

    const task = await Task.create({
      title,
      description,
      assignedTo,
      createdBy: req.user._id,
      priority: priority || 'medium',
      deadline
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private/Admin
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
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

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Users can only update status of their own tasks
    if (req.user.role === 'user' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = status;
    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate AI summary for a task
// @route   POST /api/tasks/:id/summarize
// @access  Private
const summarizeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.description || task.description.trim().length === 0) {
      return res.status(400).json({ message: 'Task has no description to summarize' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key not configured. Add OPENAI_API_KEY to .env' });
    }

    // Call OpenAI API
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a concise task summarizer. Summarize the given task in 2-3 short sentences. Focus on the key objective, deliverables, and any deadlines mentioned. Keep it professional and actionable.'
        },
        {
          role: 'user',
          content: `Task Title: ${task.title}\n\nTask Description: ${task.description}\n\nPriority: ${task.priority}\nStatus: ${task.status}${task.deadline ? `\nDeadline: ${new Date(task.deadline).toLocaleDateString()}` : ''}`
        }
      ],
      max_tokens: 150,
      temperature: 0.5
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({ message: 'Failed to generate summary' });
    }

    // Save summary to the task
    task.summary = summary;
    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    res.json(updated);
  } catch (error) {
    console.error('Summarize error:', error);

    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return res.status(401).json({ message: 'Invalid OpenAI API key' });
    }
    if (error?.status === 429) {
      return res.status(429).json({ message: 'OpenAI rate limit exceeded. Please try again later.' });
    }

    res.status(500).json({ message: error.message || 'Failed to generate summary' });
  }
};

// @desc    Summarize text without saving (for task creation preview)
// @route   POST /api/tasks/summarize-text
// @access  Private
const summarizeText = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ message: 'No description provided to summarize' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key not configured. Add OPENAI_API_KEY to .env' });
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a concise task summarizer. Summarize the given task in 2-3 short sentences. Focus on the key objective and deliverables. Keep it professional and actionable.'
        },
        {
          role: 'user',
          content: `Task Title: ${title || 'Untitled'}\n\nTask Description: ${description}`
        }
      ],
      max_tokens: 150,
      temperature: 0.5
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({ message: 'Failed to generate summary' });
    }

    res.json({ summary });
  } catch (error) {
    console.error('Summarize text error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate summary' });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, updateTaskStatus, summarizeTask, summarizeText };

