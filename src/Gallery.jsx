import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Steamed from './Steamed.jsx';
import './Gallery.css';  
import ImageModal from './ImageModal.jsx'
import TagEditor from './TagEditor.jsx';

function Gallery() {
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [editImageMode, setEditImageMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState({});
  
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const imageData = await response.json();
        console.log(imageData);
        setImages(imageData);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  const handleImageClick = useCallback((image) => {
    setCurrentImage(image);
    setIsModalOpen(true);

    const imageId = image.id;
    history.pushState({ modalOpen: true, imageId }, '', `?image=${imageId}`);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const imageId = params.get('image');

    if (imageId && images.length > 0) {
        // Find the image by its unique ID
        const image = images.find((img) => img.id === imageId);

        if (image) {
            setCurrentImage(image); 
            setIsModalOpen(true);  
        }
    }
}, [images]);

const handleModalSaveChanges = async (updatedImage) => {
  try {
    const response = await fetch(`/api/images/${updatedImage.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedImage),
    });

    console.log(response);
    console.log(updatedImage);

    if (response.ok) {
      setImages(prevImages =>
        prevImages.map(img =>
          img.id === updatedImage.id ? updatedImage : img
        )
      );
    } else {
      console.error('Failed to save changes');
    }
  } catch (error) {
    console.error('Error saving changes:', error);
  }
};

  const handleFileChange = useCallback(async (event) => {
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
  }, []);

  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const toggleImageEditMode = useCallback(() => {
    setEditImageMode(prev => !prev);
    setSelectedImages({});
  }, []);

  const handleSelectImage = useCallback((imageId) => {
    setSelectedImages(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
  }, []);

  const handleDeleteImages = useCallback(async () => {
    // Filter selected images and map to their IDs
    const imagesToDelete = Object.keys(selectedImages)
      .filter((key) => selectedImages[key]) // Only selected images
      .map((key) => images.find((image) => image.url === key)?.id) // Map to image IDs
      .filter((id) => id); // Remove any null or undefined IDs
  
    if (imagesToDelete.length === 0) {
      console.warn('No valid images selected for deletion.');
      return; // Exit early if nothing to delete
    }
  
    console.log('Images to delete:', imagesToDelete);
  
    try {
      const response = await fetch('/api/delete-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: imagesToDelete }),
      });
  
      if (response.ok) {
        // Update the images state to exclude deleted images
        setImages((current) => current.filter((image) => !imagesToDelete.includes(image.id)));
        toggleImageEditMode();
      } else {
        console.error('Failed to delete image(s)');
      }
    } catch (error) {
      console.error('Error deleting images:', error);
    }
  }, [images, selectedImages, toggleImageEditMode]);
  
  const groupedFilteredImages = useMemo(() => {
    const filtered = images.filter(image => {
      if (!searchQuery) return true;
      return image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  
    const sortedImages = filtered.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
  
    return sortedImages.reduce((acc, image) => {
      const date = new Date(image.upload_date).toLocaleDateString(); // Format date as MM/DD/YYYY
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(image);
      return acc;
    }, {});
  }, [images, searchQuery]);

  const handleAddComment = useCallback(async (commentText) => {
    if (!currentImage) return;

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
          comments: [...(prev?.comments || []), newComment]
        }));
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [currentImage]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentImage(null);

    history.pushState(null, '', window.location.pathname);
  }, []);

  return (
    <>
      <div className="home">
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
  
        <div className="gallery">
          {Object.keys(groupedFilteredImages).length > 0 ? (
            Object.entries(groupedFilteredImages).map(([date, imagesByDate]) => (
              <div key={date} className="date-group">
                <h2 className="date-marker">{date}</h2>
                <div className="image-row">
                  {imagesByDate.map((image) => (
                    <ImageItem 
                      key={image.url}
                      image={image}
                      editImageMode={editImageMode}
                      selectedImages={selectedImages}
                      handleSelectImage={handleSelectImage}
                      handleImageClick={handleImageClick}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="gallery-no-images">No images to display</div>
          )}
        </div>

        {currentImage && (
          <ImageModal
            isOpen={isModalOpen}
            closeModal={closeModal}
            currentImage={currentImage}
            onSave={handleModalSaveChanges}
          />
        )}
      </div>
      </div>
    </>
  );
}

const ImageItem = React.memo(({ image, editImageMode, selectedImages, handleSelectImage, handleImageClick }) => (
  <div
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
    <img src={image.url} alt={image.name || ''} loading="lazy" />
  </div>
));

export default Gallery;