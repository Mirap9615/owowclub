import React, { useEffect, useState, useRef } from 'react';
import Steamed from './Steamed.jsx';
import FsLightbox from "fslightbox-react";
import './Gallery.css';  

function Gallery() {
  const [imageUrls, setImageUrls] = useState([]);

  const [toggler, setToggler] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const fileInputRef = useRef(null);

    const handleImageClick = (url) => {
        setCurrentUrl(url);
        setToggler(prev => !prev); 
    };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const urls = await response.json();
        setImageUrls(urls);
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
        const newImageUrl = await response.json();
        setImageUrls(prev => [...prev, newImageUrl.imageUrl]);
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
    console.log("Selected image:" + imageId)
    setSelectedImages(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
  };

  const handleDeleteImages = async () => {
    const imagesToDelete = Object.keys(selectedImages).filter(key => selectedImages[key]);
    await fetch('/api/delete-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: imagesToDelete })
    });

    toggleEditMode();
    setImageUrls(current => current.filter(url => !imagesToDelete.includes(url)));
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
                                <button onClick={handleDeleteImages}>Delete Image</button>
                                <button onClick={toggleEditMode}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                                <button onClick={handleClickUpload}>Upload Image</button>

                                <button onClick={toggleEditMode}>Edit</button>
                            </>
                        )}
                    </div>
                </div>

                <div className={`gallery ${imageUrls.length ===0 ? 'empty' : ''}`}>
                    {imageUrls.length !== 0 ? (
                        <>
                        {imageUrls.map((url, index) => (
                            <div 
                                key={url} 
                                className={`image ${editMode ? 'edit-mode' : ''}`}
                                onClick={(e) => {
                                if (editMode) {
                                    e.stopPropagation();
                                    handleSelectImage(url);
                                } else {
                                    handleImageClick(url);
                                }
                                }}
                            >
                                {editMode && (
                                <div className="select-overlay" onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectImage(url);
                                }}>
                                    {selectedImages[url] ? '✓' : 'O'}
                                </div>
                                )}
                                <img src={url} alt="" />
                            </div>
                        
                    ))}
                    </>
                    ) : (
                        <div className="gallery-no-images">No images to display</div>
                    )}
                </div>

                <FsLightbox
                    toggler={toggler}
                    sources={[currentUrl]}
                    types={['image']}
                    captions={[<><h2>An example title.</h2><h3>An example description.</h3></>]}
                />
            </div>
        </>
  );
}

export default Gallery;
