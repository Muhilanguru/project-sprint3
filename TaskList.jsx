import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';

const TaskList = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [submitModal, setSubmitModal] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await API.get('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await API.patch(`/tasks/${taskId}/status`, { status });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitModal) return;
    setSubmitting(true);
    try {
      await API.post('/submissions', { taskId: submitModal._id, content: submitContent });
      setSubmitModal(null);
      setSubmitContent('');
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1>📋 Tasks</h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        {['all', 'pending', 'in-progress', 'completed'].map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '📊 All' : f === 'pending' ? '⏱ Pending' : f === 'in-progress' ? '⏳ In Progress' : '✅ Completed'}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No tasks found</h3>
          <p>
            {filter !== 'all'
              ? `No ${filter} tasks at the moment.`
              : 'No tasks to display.'}
          </p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={user?.role === 'admin' ? handleDelete : undefined}
              onSubmit={(t) => setSubmitModal(t)}
              onTaskUpdate={handleTaskUpdate}
            />
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {submitModal && (
        <div className="modal-overlay" onClick={() => setSubmitModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Work</h2>
              <button className="modal-close" onClick={() => setSubmitModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Submitting for: <strong style={{ color: 'var(--text-primary)' }}>{submitModal.title}</strong>
                </p>
                <div className="form-group">
                  <label htmlFor="submit-content-tasks">Your Submission</label>
                  <textarea
                    id="submit-content-tasks"
                    className="form-input"
                    placeholder="Describe your completed work..."
                    value={submitContent}
                    onChange={(e) => setSubmitContent(e.target.value)}
                    required
                    style={{ minHeight: '150px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSubmitModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : '📤 Submit Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
