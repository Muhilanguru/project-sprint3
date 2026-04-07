import { useState, useEffect } from 'react';
import API from '../api/axios';

const TaskModal = ({ isOpen, onClose, onSave, task }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    deadline: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (task) {
        setForm({
          title: task.title || '',
          description: task.description || '',
          assignedTo: task.assignedTo?._id || '',
          priority: task.priority || 'medium',
          deadline: task.deadline ? task.deadline.split('T')[0] : ''
        });
        setSummary(task.summary || '');
      } else {
        setForm({ title: '', description: '', assignedTo: '', priority: 'medium', deadline: '' });
        setSummary('');
      }
      setError('');
      setSummaryError('');
    }
  }, [isOpen, task]);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/auth/users');
      setUsers(data.filter(u => u.role === 'user'));
    } catch (err) {
      console.error('Failed to fetch users');
    }
  };

  const handleSummarize = async () => {
    if (!form.description.trim()) {
      setSummaryError('Add a description first before summarizing');
      return;
    }

    setSummarizing(true);
    setSummaryError('');

    try {
      if (task?._id) {
        // Existing task — summarize and save via task ID
        const { data } = await API.post(`/tasks/${task._id}/summarize`);
        setSummary(data.summary || '');
      } else {
        // New task — preview summary (no save yet)
        const { data } = await API.post('/tasks/summarize-text', {
          title: form.title,
          description: form.description
        });
        setSummary(data.summary || '');
      }
    } catch (err) {
      setSummaryError(err.response?.data?.message || 'Failed to generate summary');
    } finally {
      setSummarizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...form };
      // Include summary if generated during creation
      if (summary && !task) {
        payload.summary = summary;
      }

      if (task) {
        await API.put(`/tasks/${task._id}`, payload);
      } else {
        await API.post('/tasks', payload);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="modal-close" onClick={onClose} id="modal-close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">⚠ {error}</div>}

            <div className="form-group">
              <label htmlFor="task-title">Title</label>
              <input
                id="task-title"
                className="form-input"
                type="text"
                placeholder="Enter task title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                className="form-input"
                placeholder="Describe the task..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* AI Summarize Button */}
            <div className="form-group">
              <button
                type="button"
                className={`btn btn-sm btn-ai ${summarizing ? 'loading' : ''}`}
                onClick={handleSummarize}
                disabled={summarizing || !form.description.trim()}
                style={{ marginBottom: '8px' }}
              >
                {summarizing ? (
                  <>
                    <span className="btn-spinner"></span>
                    Generating Summary...
                  </>
                ) : (
                  <>🤖 {summary ? 'Regenerate Summary' : 'AI Summarize'}</>
                )}
              </button>

              {summaryError && (
                <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '8px' }}>
                  ⚠ {summaryError}
                </div>
              )}

              {summary && (
                <div className="task-summary" style={{ marginTop: '4px' }}>
                  <div className="task-summary-header">
                    <span className="task-summary-icon">🤖</span>
                    <span className="task-summary-label">AI Summary</span>
                  </div>
                  <p className="task-summary-text">{summary}</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="task-assignee">Assign To</label>
              <select
                id="task-assignee"
                className="form-select"
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                required
              >
                <option value="">Select a user...</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  className="form-select"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="task-deadline">Deadline</label>
                <input
                  id="task-deadline"
                  className="form-input"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-task-btn">
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
