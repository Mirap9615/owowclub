import React, { useState } from 'react';
import Modal from 'react-modal';
import FsLightbox from "fslightbox-react";
import TagEditor from './TagEditor';

const formatDate = (isoDate) => {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const CommentSection = React.memo(({ comments = [], onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim() === '') return;
    onAddComment(newComment);
    setNewComment('');
  };

  return (
    <div className="comment-section">
      {comments.length === 0 ? (
        <p>Be the first to comment!</p>
      ) : (
        comments.map((comment, idx) => (
          <div key={idx} className="comment">
            <strong>{comment.author}:</strong> {comment.text}
          </div>
        ))
      )}
      <input 
        type="text" 
        value={newComment} 
        onChange={(e) => setNewComment(e.target.value)} 
        placeholder="Add a comment..."
      />
      <br />
      <button onClick={handleSubmit}>Post</button>
    </div>
  );
});

const ImageModal = ({
  isOpen,
  closeModal,
  currentImage,
  onSaveChanges,
  onAddComment
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({
    name: '',
    description: '',
    tags: []
  });
  const [lightboxToggler, setLightboxToggler] = useState(false);

  const handleEditStart = () => {
    setEditFields({
      name: currentImage.name,
      description: currentImage.description,
      tags: currentImage.tags || [],
    });
    setEditMode(true);
  };

  const handleSave = () => {
    onSaveChanges(editFields);
    setEditMode(false);
  };

  const handleViewInLightbox = () => {
    setLightboxToggler(prev => !prev);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={closeModal}
        contentLabel="Detailed Image View"
        className="image-modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-title">
          <h2 style={{display: 'flex', justifyContent: 'center'}}>Detailed Image View</h2>
        </div>
        
        <img 
          src={currentImage?.url} 
          alt={currentImage?.name || 'Selected Image'} 
          className="modal-image" 
        />
        
        <div className="image-author">
          Uploaded by {currentImage?.author}
        </div>
        
        <br />
        
        <div className="modal-tags">
          {editMode ? (
            <>
              <div>
                <strong>File Name:</strong>
                <input 
                  type="text" 
                  value={editFields.name} 
                  onChange={(e) => setEditFields(prev => ({...prev, name: e.target.value}))} 
                />
              </div>
              <div>
                <strong>Description:</strong>
                <textarea 
                  value={editFields.description} 
                  onChange={(e) => setEditFields(prev => ({...prev, description: e.target.value}))}
                />
              </div>
              <div>
                <strong>Tags:</strong>
                <TagEditor 
                  tags={editFields.tags} 
                  onTagsChange={(newTags) => setEditFields(prev => ({...prev, tags: newTags}))} 
                />
              </div>
            </>
          ) : (
            <>
              <div><strong>File Name:</strong> {currentImage?.name}</div>
              <div><strong>Description:</strong> {currentImage?.description}</div>
              <div><strong>Tags:</strong> {currentImage?.tags?.join(', ') || 'No tags'}</div>
            </>
          )}
          <div>Uploaded on {currentImage?.upload_date && formatDate(currentImage.upload_date)}</div>
        </div>

        <div className="modal-buttons">
          {editMode ? (
            <>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={handleViewInLightbox}>Gallery Mode</button>
              <button onClick={handleEditStart}>Edit</button>
              <button onClick={closeModal}>Close</button>
            </>
          )}
        </div>

        <div className="comment-section">
          <h3>Comments</h3>
          <CommentSection 
            comments={currentImage?.comments} 
            onAddComment={onAddComment} 
          />
        </div>
      </Modal>

      {currentImage && (
        <FsLightbox
          toggler={lightboxToggler}
          sources={[currentImage.url]}
          captions={[
            <>
              <h2>{currentImage.title}</h2>
              <p>
                Uploaded on {formatDate(currentImage.upload_date)} by {currentImage.author}
              </p>
              <p>{currentImage.description}</p>
            </>
          ]}
          types={['image']}
        />
      )}
    </>
  );
};

export default ImageModal;