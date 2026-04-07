import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const Submissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data } = await API.get('/submissions');
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    try {
      await API.patch(`/submissions/${id}/review`, { status });
      fetchSubmissions();
    } catch (err) {
      console.error('Failed to review');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1>📤 Submissions</h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No submissions yet</h3>
          <p>{user?.role === 'admin' ? 'User submissions will appear here.' : 'You haven\'t submitted any work yet.'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                {user?.role === 'admin' && <th>User</th>}
                <th>Content</th>
                <th>Submitted</th>
                <th>Status</th>
                {user?.role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id} className="animate-in">
                  <td style={{ fontWeight: 600 }}>{sub.task?.title || 'Deleted Task'}</td>
                  {user?.role === 'admin' && (
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{sub.user?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub.user?.email}</div>
                    </td>
                  )}
                  <td>
                    <div style={{
                      maxWidth: '300px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {sub.content.length > 150 ? sub.content.substring(0, 150) + '...' : sub.content}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(sub.createdAt)}
                  </td>
                  <td>
                    <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                  </td>
                  {user?.role === 'admin' && (
                    <td>
                      {sub.status === 'submitted' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleReview(sub._id, 'approved')}
                          >
                            ✓
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReview(sub._id, 'rejected')}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Submissions;
