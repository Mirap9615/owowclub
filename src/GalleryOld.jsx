import React, { useEffect, useState, useRef } from 'react';
import Steamed from './Steamed.jsx';
import FsLightbox from "fslightbox-react";
import './Gallery.css';  
import Modal from 'react-modal';

function Gallery() {
  const [images, setImages] = useState([]);
  const [toggler, setToggler] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [editImageMode, setEditImageMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState({});

  const [editModalMode, setEditModalMode] = useState(false);
  const [editFields, setEditFields] = useState({ name: '', description: '', tags: [] });
  
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const imageData = await response.json();
        setImages(imageData);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  const handleImageClick = (image) => {
    setCurrentImage(image);
    setIsModalOpen(true);
  };

  const handleViewInLightbox = () => {
    setToggler(!toggler);
    setIsModalOpen(false);
  };

  const handleModalEditStart = () => {
    if (currentImage) {
      setEditFields({
        name: currentImage.name,
        description: currentImage.description,
        tags: currentImage.tags || '',
      });
      setEditModalMode(true);
    }
  };

  const handleModalSaveChanges = async () => {
    const updatedImage = {
      ...currentImage,
      ...editFields, 
    };
  
    try {
      const response = await fetch(`/api/images/${currentImage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedImage),
      });
  
      if (response.ok) {
        setImages(prevImages => prevImages.map(img => img.id === currentImage.id ? updatedImage : img));
        setEditModalMode(false);
        setIsModalOpen(false);
      } else {
        console.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleEditImage = async () => {
    try {
      const response = await fetch(`/api/images/${currentImage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentImage),
      });

      if (response.ok) {
        setImages(prevImages => prevImages.map(img => img.id === currentImage.id ? currentImage : img));
        setIsModalOpen(false);
      } else {
        console.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newImage = await response.json();
        setImages(prev => [...prev, newImage]);
        event.target.value = '';
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current.click();
  };

  const toggleImageEditMode = () => {
    setEditImageMode(!editImageMode);
    setSelectedImages({});
  };

  const handleSelectImage = (imageId) => {
    setSelectedImages(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
  };

  const handleDeleteImages = async () => {
    const imagesToDelete = Object.keys(selectedImages).filter(key => selectedImages[key]);
    const response = await fetch('/api/delete-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: imagesToDelete })
    });

    if (response.ok) {
      setImages(current => current.filter(image => !imagesToDelete.includes(image.url)));
      toggleImageEditMode();
    } else {
      console.error('Failed to delete image(s)');
    }
  };

  const filteredImages = images.filter(image => {
    if (!searchQuery) return true; 
  
    return image.tags.some(tag => tag.toLowerCase().includes(searchQuery)); 
  });
  

  const handleAddComment = async (commentText) => {
    try {
      const response = await fetch(`/api/images/${currentImage.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setCurrentImage(prev => ({
          ...prev,
          comments: [...prev.comments, newComment]
        }));
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentImage(null);
  };

  return (
    <>
      <Steamed />
      <div className="main">
        <div className="top-bar">
          <h1 className="gallery-title">Image Gallery</h1>
          <div className="button-group">
            {editImageMode ? (
              <>
                <button onClick={handleDeleteImages}>Confirm Deletion</button>
                <button onClick={toggleImageEditMode}>Cancel</button>
              </>
            ) : (
              <>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                <button onClick={handleClickUpload}>Upload Image</button>
                <button onClick={toggleImageEditMode}>Delete Images</button>
              </>
            )}
          </div>
        </div>

        <div className="search-bar">
              <input 
                type="text" 
                placeholder="Search by tags..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
              />
        </div>
  
        <div className={`gallery ${images.length === 0 ? 'empty' : ''}`}>
          {filteredImages.length !== 0 ? (
            filteredImages.map((image) => (
              <div
                key={image.url}
                className={`image ${editImageMode ? 'edit-mode' : ''}`}
                onClick={(e) => {
                  if (editImageMode) {
                    e.stopPropagation();
                    handleSelectImage(image.url);
                  } else {
                    handleImageClick(image);
                  }
                }}
              >
                {editImageMode && (
                  <div className="select-overlay" onClick={(e) => {
                    e.stopPropagation();
                    handleSelectImage(image.url);
                  }}>
                    {selectedImages[image.url] ? '✓' : 'O'}
                  </div>
                )}
                <img src={image.url} alt={image.name || ''} />
              </div>
            ))
          ) : (
            <div className="gallery-no-images">No images to display</div>
          )}
        </div>

  
        {currentImage && (
          <Modal
            isOpen={isModalOpen}
            onRequestClose={closeModal}
            contentLabel="Detailed Image View"
            className="image-modal"
            overlayClassName="modal-overlay"
          >
            <div className="modal-title">
              <h2 style={{display: 'flex', justifyContent: 'center'}}>Detailed Image View</h2>
            </div>
            <img src={currentImage.url} alt={currentImage.name || 'Selected Image'} className="modal-image" />
            <div className="image-author">Uploaded by {currentImage.author}</div>
            <br></br>
            <div className="modal-tags">
              {editModalMode ? (
                <>
                  <div>
                    <strong>File Name:</strong>
                    <input 
                      type="text" 
                      value={editFields.name} 
                      onChange={(e) => setEditFields({...editFields, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <strong>Description:</strong>
                    <textarea 
                      value={editFields.description} 
                      onChange={(e) => setEditFields({...editFields, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <strong>Tags:</strong>
                    <input 
                      type="text" 
                      value={editFields.tags.join(', ')} 
                      onChange={(e) => setEditFields({
                        ...editFields, 
                        tags: e.target.value.split(',').map(tag => tag.trim())
                      })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div><strong>File Name:</strong> {currentImage.name}</div>
                  <div><strong>Description:</strong> {currentImage.description}</div>
                  <div><strong>Tags:</strong> {currentImage.tags.join(', ') || 'No tags'}</div> 
                </>
              )}
            </div>

            <div className="modal-buttons">
              {editModalMode ? (
                <>
                  <button onClick={handleModalSaveChanges}>Save</button>
                  <button onClick={() => setEditModalMode(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={handleViewInLightbox}>View in Gallery Mode</button>
                  <button onClick={handleModalEditStart}>Edit</button>
                  <button onClick={closeModal}>Close</button>
                </>
              )}
            </div>

            <div className="comment-section">
              <h3>Comments</h3>
              <CommentSection comments={currentImage.comments} onAddComment={handleAddComment} />
            </div>
          </Modal>
        )}
  
        {currentImage && (
          <FsLightbox
            toggler={toggler}
            sources={[currentImage.url]}
            captions={[<>
              <h2>{currentImage.title}</h2>
              <p>{currentImage.uploadDate} by {currentImage.author}</p>
              <p>{currentImage.description}</p>
            </>]}
            types={['image']}
          />
        )}
      </div>
    </>
  );
}  

function CommentSection({ comments = [], onAddComment }) {
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
      <button onClick={handleSubmit}>Post</button>
    </div>
  );
}

export default Gallery;
