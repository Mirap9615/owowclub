import React, { useEffect, useState, useRef } from 'react';
import Steamed from './Steamed.jsx';
import FsLightbox from "fslightbox-react";
import './Gallery.css';  

function Gallery() {
  const [images, setImages] = useState([]);
  const [toggler, setToggler] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const fileInputRef = useRef(null);

  const handleImageClick = async (image) => {

    const response = await fetch(`/users/${image.author}`);
    const userData = await response.json();

    if (response.ok) {
        const formattedDate = new Date(image.upload_date).toLocaleDateString("en-US", {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        setCurrentImage({
            ...image,
            author: userData.name,  
            uploadDate: formattedDate
          });
        
          setToggler(prev => {
            return !prev;
        }); 
    }   else {
        console.error('Failed to fetch user data:', userData.error);
    }
    
    };

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
        setImages(prev => {
          const updatedImages = [...prev, newImage];
          return updatedImages;
        });
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

  const [editMode, setEditMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState({});

  const toggleEditMode = () => {
    setEditMode(!editMode);
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
        toggleEditMode();
    } else {
        console.error('Failed to delete image(s)')
    }
    
  };  

  return (
        <>
            <Steamed />
            <div className="main">
                <div className="top-bar">
                    <h1 className="gallery-title">Image Gallery</h1>
                    <div className="button-group">
                        {editMode ? (
                            <>
                                <button onClick={handleDeleteImages}>Confirm Deletion</button>
                                <button onClick={toggleEditMode}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                                <button onClick={handleClickUpload}>Upload Image</button>

                                <button onClick={toggleEditMode}>Delete Images</button>
                            </>
                        )}
                    </div>
                </div>

                <div className={`gallery ${images.length ===0 ? 'empty' : ''}`}>
                    {images.length !== 0 ? (
                        <>
                        {images.map((image, index) => (
                            <div 
                                key={image.url} 
                                className={`image ${editMode ? 'edit-mode' : ''}`}
                                onClick={(e) => {
                                if (editMode) {
                                    e.stopPropagation();
                                    handleSelectImage(image.url);
                                } else {
                                    handleImageClick(image);
                                }
                                }}
                            >
                                {editMode && (
                                <div className="select-overlay" onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectImage(image.url);
                                }}>
                                    {selectedImages[image.url] ? '✓' : 'O'}
                                </div>
                                )}
                                <img src={image.url} alt={image.name || ''} />
                            </div>
                        ))}
                    </>
                    ) : (
                        <div className="gallery-no-images">No images to display</div>
                    )}
                </div>

                
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

            </div>
        </>
  );
}

export default Gallery;
