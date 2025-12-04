import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Steamed from './Steamed.jsx';
import './Gallery.css';
import MediaModal from './MediaModal.jsx'; // Make sure you have created/renamed this component

function Gallery() {
  // --- STATE ---
  const [media, setMedia] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState({});
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/media');
        const mediaData = await response.json();
        console.log(mediaData);
        setMedia(mediaData);
      } catch (error) {
        console.error('Error fetching media:', error);
      }
    };
    fetchMedia();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const eventData = await response.json();
        setEvents(eventData);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchEvents();
  }, []);

  // --- HANDLERS ---
  const handleMediaClick = useCallback((mediaItem) => {
    setCurrentMedia(mediaItem);
    setIsModalOpen(true);
    history.pushState({ modalOpen: true, mediaId: mediaItem.id }, '', `?media=${mediaItem.id}`);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('media');

    if (mediaId && media.length > 0) {
      const mediaItem = media.find((item) => item.id === mediaId);
      if (mediaItem) {
        setCurrentMedia(mediaItem);
        setIsModalOpen(true);
      }
    }
  }, [media]);

  const handleModalSaveChanges = async (updatedMedia) => {
    try {
      const response = await fetch(`/api/media/${updatedMedia.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMedia),
      });

      if (response.ok) {
        setMedia(prevMedia =>
          prevMedia.map(item =>
            item.id === updatedMedia.id ? updatedMedia : item
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
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append('media', file);

      try {
        const response = await fetch('/upload-media', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const newMediaItem = await response.json();
          setMedia(prev => [...prev, newMediaItem]);
        } else {
          console.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    event.target.value = '';
  }, []);

  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev);
    setSelectedMedia({});
  }, []);

  const handleSelectMedia = useCallback((mediaUrl) => {
    setSelectedMedia(prev => ({
      ...prev,
      [mediaUrl]: !prev[mediaUrl]
    }));
  }, []);

  const handleDeleteMedia = useCallback(async () => {
    const mediaToDelete = Object.keys(selectedMedia)
      .filter(key => selectedMedia[key])
      .map(url => media.find(item => item.url === url)?.id)
      .filter(id => id);

    if (mediaToDelete.length === 0) {
      console.warn('No valid media selected for deletion.');
      return;
    }

    try {
      const response = await fetch('/api/delete-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media: mediaToDelete }),
      });

      if (response.ok) {
        setMedia(current => current.filter(item => !mediaToDelete.includes(item.id)));
        toggleEditMode();
      } else {
        console.error('Failed to delete media item(s)');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  }, [media, selectedMedia, toggleEditMode]);

  const groupedFilteredMedia = useMemo(() => {
    const filtered = media.filter(item => {
      const matchesSearch = !searchQuery || (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesEvent = !selectedEvent || item.associated_event_id == selectedEvent;
      return matchesSearch && matchesEvent;
    });

    const sortedMedia = filtered.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));

    const byDate = sortedMedia.reduce((acc, item) => {
      const date = new Date(item.upload_date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});

    return Object.entries(byDate).map(([date, items]) => {
      const eventIds = new Set();
      let eventName = null;
      let hasItemsWithoutEvent = false;

      items.forEach(item => {
        if (item.associated_event_id) {
          eventIds.add(item.associated_event_id);
          if (!eventName) eventName = item.event_name;
        } else {
          hasItemsWithoutEvent = true;
        }
      });

      let primaryHeader = date;
      let secondaryHeader = null;

      if (!hasItemsWithoutEvent && eventIds.size === 1) {
        primaryHeader = eventName || "Untitled Event";
        secondaryHeader = date;
      }

      return {
        id: date,
        primaryHeader,
        secondaryHeader,
        items
      };
    });
  }, [media, searchQuery, selectedEvent]);

  const handleAddComment = useCallback(async (commentText) => {
    if (!currentMedia) return;
    try {
      const response = await fetch(`/api/media/${currentMedia.id}/comments`, { /* ... */ });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [currentMedia]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentMedia(null);
    history.pushState(null, '', window.location.pathname);
  }, []);

  return (
    <>
      <div className="home">
        <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
        </header>
        <div className="container">
          <h1 className="gallery-title">Media Gallery</h1>

          <div className="gallery-controls">
            {/* Row 1: Search Bar (Full Width) */}
            <div className="search-bar-container">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search by tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Filter (Centered) */}
            <div className="filter-container">
              <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                <option value="">All Events</option>
                {events.map(event => (<option key={event.id} value={event.id}>{event.title}</option>))}
              </select>
            </div>

            {/* Row 3: Buttons (Centered) */}
            <div className="button-actions">
              {editMode ? (
                <>
                  <button onClick={handleDeleteMedia} disabled={!Object.values(selectedMedia).some(v => v)} className="button-danger">
                    DELETE SELECTED
                  </button>
                  <button onClick={toggleEditMode} className="button-secondary">CANCEL</button>
                </>
              ) : (
                <>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" multiple style={{ display: 'none' }} />
                  <button onClick={handleClickUpload} className="header-action-link">UPLOAD MEDIA</button>
                  <button onClick={toggleEditMode} className="header-action-link">MANAGE MEDIA</button>
                </>
              )}
            </div>
          </div>

          <div className="gallery">
            {groupedFilteredMedia.length > 0 ? (
              groupedFilteredMedia.map((group) => (
                <div key={group.id} className="date-group">
                  <div className="group-header">
                    <h2 className="date-marker">{group.primaryHeader}</h2>
                    {group.secondaryHeader && <span className="secondary-header">{group.secondaryHeader}</span>}
                  </div>
                  <div className="media-row">
                    {group.items.map((item) => (
                      <MediaItem
                        key={item.url}
                        media={item}
                        editMode={editMode}
                        selectedMedia={selectedMedia}
                        handleSelectMedia={handleSelectMedia}
                        handleMediaClick={handleMediaClick}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="gallery-no-items">No media to display</div>
            )}
          </div>

          {currentMedia && (
            <MediaModal
              isOpen={isModalOpen}
              closeModal={closeModal}
              currentMedia={currentMedia}
              onSave={handleModalSaveChanges}
            />
          )}
        </div>
      </div>
    </>
  );
}

const MediaItem = React.memo(({ media, editMode, selectedMedia, handleSelectMedia, handleMediaClick }) => (
  <div
    className={`media-item ${editMode ? 'edit-mode' : ''} ${media.media_type === 'video' ? 'is-video' : ''}`} onClick={(e) => {
      if (editMode) {
        e.stopPropagation();
        handleSelectMedia(media.url);
      } else {
        handleMediaClick(media);
      }
    }}
  >
    {editMode && (
      <div className="select-overlay" onClick={(e) => { e.stopPropagation(); handleSelectMedia(media.url); }}>
        {selectedMedia[media.url] ? '✓' : 'O'}
      </div>
    )}

    {media.media_type === 'video' ? (
      media.thumbnail_url ? (
        <img src={media.thumbnail_url} alt={media.name || ''} loading="lazy" className="media-thumbnail" />
      ) : (
        <video src={media.url} muted playsInline className="media-thumbnail" />
      )
    ) : (
      <img src={media.url} alt={media.name || ''} loading="lazy" className="media-thumbnail" />
    )}
  </div>
));

export default Gallery;