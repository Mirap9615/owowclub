import React, { useState, useEffect } from 'react';
import './Comments.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons';

const Comments = ({ commentableId }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('Newest First');
  const [showPostButton, setShowPostButton] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch('/user-details');
        if (response.ok) {
          const user = await response.json();
          setUserDetails(user);
          setCurrentUserId(user.user_id);
        } else {
          console.error('Failed to fetch user details');
        }
      } catch (err) {
        console.error(err.message);
      }
    };
  
    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/comments?commentableId=${commentableId}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const data = await response.json();
        console.log(data);
        setComments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchComments();
  }, [commentableId]);  

  const sortComments = (commentsList) => {
    if (sortOrder === 'Newest First') {
      return commentsList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return commentsList; 
  };

  const formatRelativeTime = (createdAt) => {
    const now = Date.now(); // Current time in UTC (ms)
    const createdTime = new Date(createdAt).getTime(); // Created time in UTC (ms)
    const diffMs = now - createdTime; // Difference in ms
  
    if (diffMs < 0) {
      console.error(`Future timestamp detected: ${createdAt}`);
      return 'commented';
    }
  
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
  
    if (diffMinutes < 5) {
      return 'commented';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 12) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          commentableId,
        }),
      });
      if (!response.ok) throw new Error('Failed to post comment');
      const comment = await response.json();
      setComments((prev) => sortComments([...prev, comment]));
      setNewComment('');
      setShowPostButton(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = (commentId) => {
    setEditingCommentId(commentId);
    const commentToEdit = comments.find((comment) => comment.id === commentId);
    setEditedContent(commentToEdit.content);
  };
  
  const saveEditedComment = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      });
      if (!response.ok) throw new Error('Failed to update comment');
      const updatedComment = await response.json();
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? { ...comment, content: updatedComment.content } : comment
        )
      );
      setEditingCommentId(null);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleLike = async (commentId, userLiked) => {
    try {
      const endpoint = userLiked
        ? `/api/comments/${commentId}/unlike`
        : `/api/comments/${commentId}/like`;
  
      const method = userLiked ? 'DELETE' : 'POST';
      const response = await fetch(endpoint, { method });
  
      if (response.ok) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  like_count: userLiked ? comment.like_count - 1 : comment.like_count + 1,
                  user_liked: !userLiked,
                }
              : comment
          )
        );
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="comments-container">
      <div className="comments-header">
        <h3>{comments.length} Comment(s)</h3>
        <div className="sort-by">
          <button onClick={() => setSortOrder('Newest First')}>{sortOrder}</button>
        </div>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {comments.length === 0 && !loading && <p>No comments yet. Be the first to comment!</p>}
      <div className="comment-section">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-user">
              <strong>{comment.username}</strong>
              <span className="comment-time">{" " + formatRelativeTime(comment.created_at)}</span>
            </div>
            <div className="comment-content">
              {editingCommentId === comment.id ? (
                <>
                  <input
                    type="text"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <button onClick={() => saveEditedComment(comment.id)}>Save</button>
                  <button onClick={() => setEditingCommentId(null)}>Cancel</button>
                </>
              ) : (
                comment.content
              )}
            </div>
            <div className="comment-actions">
              {userDetails ? (
                <>
                  <button
                    className={`like-button ${comment.user_liked ? 'liked' : ''}`}
                    onClick={() => handleLike(comment.id, comment.user_liked)}
                  >
                    <FontAwesomeIcon icon={faThumbsUp} size="sm" /> {comment.like_count}
                  </button>
                  {currentUserId === comment.user_id && (
                    <button onClick={() => handleEditComment(comment.id)}>Edit</button>
                  )}
                  {(currentUserId === comment.user_id || userDetails.admin) && (
                    <button onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                  )}
                </>
              ) : (
                <>
                  <button className="like-button" disabled title="Log in to like comments">
                    <FontAwesomeIcon icon={faThumbsUp} size="sm" /> {comment.like_count}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="add-comment">
        {userDetails ? (
          <>
            <input
              type="text"
              value={newComment}
              onFocus={() => setShowPostButton(true)}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
            />
            {showPostButton && (
              <button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                Post
              </button>
            )}
          </>
        ) : (
          <p>Please <a href="/login">log in</a> to post a comment.</p>
        )}
      </div>
    </div>
  );
};

export default Comments;
