import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const TaskCard = ({ task, onStatusChange, onDelete, onSubmit, onTaskUpdate }) => {
  const { user } = useAuth();
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No deadline';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummaryError('');
    try {
      const { data } = await API.post(`/tasks/${task._id}/summarize`);
      if (onTaskUpdate) onTaskUpdate(data);
    } catch (err) {
      setSummaryError(err.response?.data?.message || 'Failed to generate summary');
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="task-card animate-in">
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <span className={`badge badge-${task.status}`}>
          {task.status === 'in-progress' ? '⏳ In Progress' : task.status === 'completed' ? '✅ Completed' : '⏱ Pending'}
        </span>
      </div>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      {/* AI Summary Section */}
      {task.summary && (
        <div className="task-summary">
          <div className="task-summary-header">
            <span className="task-summary-icon">🤖</span>
            <span className="task-summary-label">AI Summary</span>
          </div>
          <p className="task-summary-text">{task.summary}</p>
        </div>
      )}

      {summaryError && (
        <div className="alert alert-error" style={{ marginBottom: 0, padding: '8px 12px', fontSize: '12px' }}>
          ⚠ {summaryError}
        </div>
      )}

      <div className="task-card-meta">
        <span className={`badge badge-${task.priority}`}>
          {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
        </span>
        <span style={{ fontSize: '12px', color: isOverdue ? 'var(--danger-400)' : 'var(--text-muted)' }}>
          📅 {formatDate(task.deadline)} {isOverdue && '(Overdue!)'}
        </span>
        {task.assignedTo && (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            👤 {task.assignedTo.name || task.assignedTo.email}
          </span>
        )}
      </div>

      <div className="task-card-footer">
        <div className="task-card-actions">
          {/* Summarize Button */}
          {task.description && (
            <button
              className={`btn btn-sm btn-ai ${summarizing ? 'loading' : ''}`}
              onClick={handleSummarize}
              disabled={summarizing}
              title={task.summary ? 'Regenerate AI Summary' : 'Generate AI Summary'}
            >
              {summarizing ? (
                <>
                  <span className="btn-spinner"></span>
                  Summarizing...
                </>
              ) : (
                <>🤖 {task.summary ? 'Re-summarize' : 'Summarize'}</>
              )}
            </button>
          )}

          {/* Status change buttons for assigned users */}
          {user?.role === 'user' && task.status !== 'completed' && (
            <>
              {task.status === 'pending' && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => onStatusChange(task._id, 'in-progress')}
                >
                  ▶ Start
                </button>
              )}
              {task.status === 'in-progress' && onSubmit && (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => onSubmit(task)}
                >
                  📤 Submit
                </button>
              )}
            </>
          )}

          {/* Admin actions */}
          {user?.role === 'admin' && onDelete && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(task._id)}
            >
              🗑 Delete
            </button>
          )}
        </div>

        {task.status === 'completed' && !task.description && (
          <span style={{ fontSize: '12px', color: 'var(--success-400)' }}>✓ Task completed</span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
