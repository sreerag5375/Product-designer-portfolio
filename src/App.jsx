import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { DotLottiePlayer } from '@dotlottie/react-player';
import JSZip from 'jszip';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const renderFormattedText = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  const result = [];
  let currentList = [];

  const parseBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ')) {
      currentList.push(<li key={`${index}-li`}>{parseBold(trimmed.slice(2).trim())}</li>);
    } else {
      if (currentList.length > 0) {
        result.push(<ul key={`${index}-ul`} className="desc-list">{currentList}</ul>);
        currentList = [];
      }
      if (trimmed) {
        result.push(<p key={index} className="desc-para">{parseBold(trimmed)}</p>);
      }
    }
  });

  if (currentList.length > 0) {
    result.push(<ul key="final-ul" className="desc-list">{currentList}</ul>);
  }

  return result;
};

const SortableImageRow = ({ item, sIdx, iIdx, onRemove, onTitleChange, onImageChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id || item._id || `item-${sIdx}-${iIdx}` });

  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative'
  };

  return (
    <div ref={setNodeRef} style={style} className={`modern-item-row ${isDragging ? 'dragging' : ''}`}>
      <div className="row-controls" {...attributes} {...listeners}>
        <div className="drag-handle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
        </div>
      </div>
      <div className="row-inputs">
        <input 
          type="text" 
          placeholder="Image Title" 
          value={item.title || ''} 
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <div className="item-meta-info">
          {item.imageUrl ? "Existing Image" : "Newly Uploaded"}
        </div>
      </div>
      <div className="mini-preview-box" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }} title="Click to change image">
        {(item.imageBase64 || item.imageUrl) ? (
          <img src={item.imageBase64 || item.imageUrl} alt="Thumbnail" />
        ) : (
          <div className="upload-placeholder-mini">+</div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden-input" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>
      <button type="button" className="row-delete" onClick={() => onRemove()}>✕</button>
    </div>
  );
};

const SortableDesignSection = ({ 
  section, sIdx, onTitleChange, onRemoveSection, handleItemImageUpload, 
  handleDragEnd, sensors, SortableImageRow, setFormData, formData 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id || `section-${sIdx}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className={`form-card-section ${isDragging ? 'dragging-section' : ''}`}>
      <div className="section-header-modern">
        <div className="header-top-row">
          <div className="section-drag-handle" {...attributes} {...listeners}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
          </div>
          <input 
            type="text" 
            value={section.title || ''} 
            placeholder="Section Title (e.g. Design System)" 
            onChange={e => onTitleChange(e.target.value)} 
          />
          <button type="button" className="remove-pill-btn" onClick={onRemoveSection} title="Delete Section">✕</button>
        </div>
        
        <div className="header-actions-row">
          <div className="bulk-upload-wrapper">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden-input" 
              id={`add-img-${sIdx}`}
              onChange={(e) => handleItemImageUpload(sIdx, e)} 
              onClick={(e) => e.stopPropagation()}
            />
            <label 
              htmlFor={`add-img-${sIdx}`} 
              className="bulk-add-btn primary-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <span>🖼️</span> Add Image
            </label>
          </div>

          <div className="bulk-upload-wrapper">
            <input 
              type="file" 
              multiple 
              id={`bulk-${sIdx}`}
              accept="image/*,.zip" 
              className="hidden-input" 
              onChange={(e) => handleItemImageUpload(sIdx, e)} 
              onClick={(e) => e.stopPropagation()}
            />
            <label 
              htmlFor={`bulk-${sIdx}`} 
              className="bulk-add-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <span>🚀</span> Bulk / ZIP
            </label>
          </div>

          <div className="bulk-upload-wrapper">
            <input 
              type="file" 
              webkitdirectory="" 
              directory="" 
              multiple 
              id={`folder-${sIdx}`}
              className="hidden-input" 
              onChange={(e) => handleItemImageUpload(sIdx, e)} 
              onClick={(e) => e.stopPropagation()}
            />
            <label 
              htmlFor={`folder-${sIdx}`} 
              className="bulk-add-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <span>📂</span> Folder
            </label>
          </div>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => handleDragEnd(event, sIdx)}
      >
        <SortableContext 
          items={section.items.map(item => item.id || item._id || `item-${sIdx}-${section.items.indexOf(item)}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="nested-item-list">
            {section.items.map((item, iIdx) => (
              <SortableImageRow 
                key={item.id || item._id || `item-${sIdx}-${iIdx}`}
                item={item}
                sIdx={sIdx}
                iIdx={iIdx}
                onTitleChange={(newTitle) => {
                  const newSections = [...formData.designSections];
                  newSections[sIdx].items[iIdx].title = newTitle;
                  setFormData({ ...formData, designSections: newSections });
                }}
                onImageChange={(newBase64) => {
                  const newSections = [...formData.designSections];
                  newSections[sIdx].items[iIdx].imageBase64 = newBase64;
                  setFormData({ ...formData, designSections: newSections });
                }}
                onRemove={() => {
                  const newSections = [...formData.designSections];
                  newSections[sIdx].items = newSections[sIdx].items.filter((_, i) => i !== iIdx);
                  setFormData({ ...formData, designSections: newSections });
                }}
              />
            ))}
            {section.items.length === 0 && (
              <div className="empty-section-placeholder">
                No images yet. Use Bulk Upload to add screens.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

const Portfolio = () => {
  const { projectSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('works');
  const [isWindowVisible, setIsWindowVisible] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectDetail, setProjectDetail] = useState(null); // lazily-loaded full project
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle slug-based project selection
  useEffect(() => {
    if (projects.length > 0) {
      if (projectSlug) {
        // If we have a slug in the URL, try to find the project
        const found = projects.find(p => 
          p.slug === projectSlug || 
          p._id === projectSlug || 
          (p.name && p.name.toLowerCase().replace(/[\s_-]+/g, '-') === projectSlug)
        );
        if (found) {
          setSelectedFolder(found._id);
          setActiveTab('works');
          setIsWindowVisible(true);
          fetchProjectDetail(found._id);
        } else if (projectSlug === 'admin') {
          return;
        } else {
          const tabs = ['about', 'works', 'writings', 'learning'];
          if (tabs.includes(projectSlug)) {
            setActiveTab(projectSlug);
            setIsWindowVisible(true);
            setSelectedFolder(null);
          }
        }
      } else {
        if (location.pathname === '/') {
          setSelectedFolder(null);
          setProjectDetail(null);
        }
      }
    }
  }, [projectSlug, projects, location.pathname]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Only fetch lightweight fields — name, slug, type, category (NO images)
      const response = await fetch('/api/projects?fields=list');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setProjects([
        { _id: '1', name: 'LIVO', type: 'webapp', category: 'Logistics' },
        { _id: '2', name: 'Arikil Ai', type: 'app', category: 'AI' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Lazy-load the full project (with images) only when a folder is opened
  const fetchProjectDetail = async (idOrSlug) => {
    setDetailLoading(true);
    setProjectDetail(null);
    try {
      const response = await fetch(`/api/projects?id=${encodeURIComponent(idOrSlug)}`);
      if (!response.ok) throw new Error('Failed to fetch project detail');
      const data = await response.json();
      setProjectDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'works':
        if (selectedFolder) {
          // Use cached lightweight data for instant render — already in memory
          const cachedFolder = projects.find(f => f._id === selectedFolder);

          // Use full detail once loaded, fall back to cached for text fields
          const folder = projectDetail || cachedFolder;

          // If we somehow have no data at all, show spinner
          if (!folder) {
            return (
              <div className="detail-loading-state">
                <div className="detail-spinner"></div>
                <p className="detail-loading-text">Loading project…</p>
              </div>
            );
          }

          return (
            <div className="project-detail animate-in">
              {/* Header — renders immediately from cached data */}
              <div className="project-header-row">
                <div className="project-logo-box">
                  <img src={folder.logoBase64} alt="Logo" />
                </div>
                <div className="title-group">
                  <h1 className="window-hero-title">{folder.name}</h1>
                  <p className="project-subtitle">{folder.subtitle}</p>
                  <div className="meta-pill-container">
                    <span className="meta-pill">{folder.type}</span>
                    <span className="meta-pill">{folder.category}</span>
                  </div>
                </div>
              </div>

              {/* Description — renders immediately from cached data */}
              <div className="content-section">
                <div className="what-we-like-text">{renderFormattedText(folder.description)}</div>
              </div>

              {/* Screenshots — only available after lazy fetch completes */}
              {detailLoading || !projectDetail ? (
                <div className="screenshots-loading">
                  <div className="detail-spinner"></div>
                  <p className="detail-loading-text">Loading design screenshots…</p>
                </div>
              ) : (
                projectDetail.designSections?.map((section, sIdx) => (
                  <div key={sIdx} className="content-section">
                    <h2 className="section-label">{section.title}</h2>
                    <div className={`screenshots-tray ${(folder.type === 'website' || folder.type === 'webapp') ? 'is-web' : ''}`}>
                      {section.items?.map((item, iIdx) => (
                        <div key={iIdx} className="screen-card">
                          <img src={item.imageBase64} alt={item.title} className="screen-shot" loading="lazy" />
                          <span className="screen-title">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Links — renders immediately from cached data */}
              {(folder.links?.website || folder.links?.playStore || folder.links?.appStore) && (
                <div className="project-footer-links">
                  <div className="footer-divider"></div>
                  <span className="footer-section-label">LIVE NOW</span>
                  <div className="platform-links">
                    {folder.links?.website && (
                      <a href={folder.links.website} target="_blank" className="link-btn">
                        <div className="link-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        </div>
                        <div className="link-text">
                          <span className="link-label">VISIT OFFICIAL</span>
                          <span className="link-brand">Website</span>
                        </div>
                      </a>
                    )}
                    {folder.links?.playStore && (
                      <a href={folder.links.playStore} target="_blank" className="link-btn">
                        <div className="link-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5Z" fill="#00E676"/><path d="M16.92 15.23L13.69 12L16.92 8.77L20.56 10.85C21.41 11.34 21.41 12.67 20.56 13.15L16.92 15.23Z" fill="#F44336"/><path d="M13.69 12L3.84 2.15C4.01 2.07 4.2 2.03 4.41 2.03C4.73 2.03 5.04 2.11 5.31 2.27L16.92 8.77L13.69 12Z" fill="#2196F3"/><path d="M13.69 12L16.92 15.23L5.31 21.73C5.04 21.89 4.73 21.97 4.41 21.97C4.2 21.97 4.01 21.93 3.84 21.85L13.69 12Z" fill="#FFC107"/></svg>
                        </div>
                        <div className="link-text">
                          <span className="link-label">GET IT ON</span>
                          <span className="link-brand">Google Play</span>
                        </div>
                      </a>
                    )}
                    {folder.links?.appStore && (
                      <a href={folder.links.appStore} target="_blank" className="link-btn">
                        <div className="link-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71,19.5c-.83,1.24-1.71,2.45-3.1,2.48s-1.84-.85-3.44-.85-2.05.83-3.38.88-2.31-1.29-3.14-2.49c-1.69-2.45-2.98-6.93-1.25-9.95s3.59-3.8,5.43-3.8c1.78,0,3,1.06,4,1.06s2.51-1.28,4.6-1.07c.88.04,3.35.32,4.9,2.59-1.39.81-2.33,2.23-2.33,4.09,0,2.15,1.15,3.69,2.81,4.5a13.31,13.31,0,0,1-2.1,3.65ZM15.42,4.38a4.67,4.67,0,0,0,1.23-3.41,4.52,4.52,0,0,0-3.19,1.64,4.28,4.28,0,0,0-1.26,3.19c0,.08.01.16.02.24.16,0,.32.01.48.01a4.23,4.23,0,0,0,2.72-.68Z" /></svg>
                        </div>
                        <div className="link-text">
                          <span className="link-label">Download on the</span>
                          <span className="link-brand">App Store</span>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }

        return (
          <>
            <h1 className="window-hero-title">Things I Designed</h1>
            <div className="folder-grid">
              {loading ? (
                /* Shimmer Grid */
                [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="folder-item skeleton-item">
                    <div className="folder-icon-wrapper skeleton"></div>
                    <div className="skeleton-text"></div>
                  </div>
                ))
              ) : (
                /* Real Folders */
                projects.map(folder => (
                  <div key={folder._id} className="folder-item" onClick={() => {
                    setSelectedFolder(folder._id);
                    setProjectDetail(null);
                    fetchProjectDetail(folder._id);
                    navigate(`/${folder.slug || folder._id}`);
                  }}>
                    <div className="folder-icon-wrapper">
                      <img src="/folder.png" alt="Folder" className="folder-img" />
                    </div>
                    <span className="folder-name">{folder.name}</span>
                  </div>
                ))
              )}
            </div>
          </>
        );
      case 'about':
      case 'writings':
      case 'learning':
        return (
          <div className="cooking-container animate-in">
            <div className="lottie-wrap">
              <DotLottiePlayer
                src="/Nap Emoji.lottie"
                autoplay
                loop
                style={{ width: '220px', height: '220px' }}
              />
            </div>
            <h1 className="cooking-title">Still cooking…</h1>
            <p className="cooking-desc">This section is taking a nap. I’ll wake it up soon.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <main>
        <div className="immersive-bg"></div>
        {isWindowVisible && (
          <div className={`window-overlay active ${isFullScreen ? 'full-screen-overlay' : ''}`} onClick={() => { setIsWindowVisible(false); setSelectedFolder(null); setIsFullScreen(false); }}>
            <div className={`mac-window ${isFullScreen ? 'full-screen' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="window-header">
              <div className="traffic-lights">
                {selectedFolder && activeTab === 'works' ? (
                  <div className="header-left-actions">
                    <button className="header-back-button" onClick={() => {
                      setSelectedFolder(null);
                      navigate('/');
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
                    </button>
                    <button className="header-fullscreen-button" onClick={() => setIsFullScreen(!isFullScreen)}>
                      {isFullScreen ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="4" width="12" height="12" rx="1.5"></rect><path d="M4 8v10a2 2 0 0 0 2 2h10"></path></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="traffic-dot red" onClick={() => setIsWindowVisible(false)}><span>✕</span></span>
                    <span className="traffic-dot yellow" onClick={() => setIsFullScreen(false)}><span>−</span></span>
                    <span className="traffic-dot green" onClick={() => setIsFullScreen(!isFullScreen)}><span>+</span></span>
                  </>
                )}
              </div>
              <div className="window-title">
                {selectedFolder && activeTab === 'works' ? projects.find(f => f._id === selectedFolder)?.name : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </div>
              <div className="window-actions-placeholder" style={{ width: '52px' }}></div>
            </div>
            <div className="window-body">{renderContent()}</div>
            </div>
          </div>
        )}
      </main>
      {!isFullScreen && (
        <div className="dock-container">
        <nav className="dock">
          {[
            { id: 'about', label: 'About', icon: 'Profile.png' },
            { id: 'works', label: 'Works', icon: 'Works.png' },
            { id: 'writings', label: 'Writings', icon: 'Writings.png' },
            { id: 'learning', label: 'Learning', icon: 'Learnings.png' }
          ].map(item => (
            <button
              key={item.id}
              className={`dock-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { 
                setActiveTab(item.id); 
                setIsWindowVisible(true);
                if (item.id === 'works' && selectedFolder) {
                  const project = projects.find(p => p._id === selectedFolder);
                  if (project) navigate(`/${project.slug || project._id}`);
                } else if (item.id !== 'works') {
                  navigate('/'); // Or navigate common routes? For now simpler as is.
                }
              }}
            >
              <div className="dock-item-content">
                <span className="tooltip">{item.label}</span>
                <img src={`/${item.icon}`} alt={item.label} className="dock-icon" />
                {activeTab === item.id && <div className="active-dot"></div>}
              </div>
            </button>
          ))}
        </nav>
      </div>
      )}
    </div>
  );
};

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'app',
    category: '',
    subtitle: '',
    logoBase64: '',
    links: { playStore: '', appStore: '', website: '' },
    designSections: [{ title: '', items: [] }]
  });
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, type: 'success', message: '', details: '' });
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

  const showToast = (type, message, details = '') => {
    setToast({ show: true, type, message, details });
    if (type === 'success') {
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSectionDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = formData.designSections.findIndex(s => (s.id || `section-${formData.designSections.indexOf(s)}`) === active.id);
      const newIndex = formData.designSections.findIndex(s => (s.id || `section-${formData.designSections.indexOf(s)}`) === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setFormData({
          ...formData,
          designSections: arrayMove(formData.designSections, oldIndex, newIndex)
        });
      }
    }
  };

  const handleDragEnd = (event, sIdx) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newSections = [...formData.designSections];
      const items = [...newSections[sIdx].items];
      
      const oldIndex = items.findIndex(item => (item.id || item._id || `item-${sIdx}-${items.indexOf(item)}`) === active.id);
      const newIndex = items.findIndex(item => (item.id || item._id || `item-${sIdx}-${items.indexOf(item)}`) === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        newSections[sIdx].items = arrayMove(items, oldIndex, newIndex);
        setFormData({ ...formData, designSections: newSections });
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchProjects();
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoBase64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const moveItem = (sIdx, iIdx, direction) => {
    const newSections = [...formData.designSections];
    const items = [...newSections[sIdx].items];
    const targetIdx = direction === 'up' ? iIdx - 1 : iIdx + 1;

    // Swap items
    [items[iIdx], items[targetIdx]] = [items[targetIdx], items[iIdx]];
    newSections[sIdx].items = items;
    setFormData({ ...formData, designSections: newSections });
  };


  const compressImage = (base64Str, maxWidth = 1600, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleItemImageUpload = async (sIdx, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let newSections = [...formData.designSections];
    const section = newSections[sIdx];
    const groupedFiles = {};

    // Helper to clean titles
    const cleanTitle = (name) => {
      return name
        .replace(/\.[^/.]+$/, "") 
        .replace(/[_-]/g, " ")     
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const processFile = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result);
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            title: cleanTitle(file.name),
            imageBase64: compressed
          });
        };
        reader.readAsDataURL(file);
      });
    };

    // 1. Handle ZIP File
    const firstFile = files[0];
    if (firstFile.name.endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(firstFile);
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir && /\.(png|jpe?g|gif|webp|svg)$/i.test(zipEntry.name)) {
            const parts = relativePath.split('/');
            const group = parts.length > 1 ? cleanTitle(parts[parts.length - 2]) : "General";
            if (!groupedFiles[group]) groupedFiles[group] = [];
            
            const blob = await zipEntry.async('blob');
            const file = new File([blob], zipEntry.name, { type: blob.type });
            const processed = await processFile(file);
            groupedFiles[group].push(processed);
          }
        }
      } catch (err) {
        console.error("ZIP Error:", err);
        showToast('error', 'Failed to read ZIP file', err.message);
      }
    } 
    // 2. Handle Folder/Multiple Files Grouping
    else {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const path = file.webkitRelativePath || "";
          const parts = path.split('/');
          const group = parts.length > 1 ? cleanTitle(parts[parts.length - 2]) : null;
          
          if (group) {
            if (!groupedFiles[group]) groupedFiles[group] = [];
            groupedFiles[group].push(await processFile(file));
          } else {
            if (!groupedFiles["_default"]) groupedFiles["_default"] = [];
            groupedFiles["_default"].push(await processFile(file));
          }
        }
      }
    }

    // Distribute into sections
    const groups = Object.keys(groupedFiles);
    if (groups.length > 0) {
      groups.forEach((groupName, idx) => {
        const items = groupedFiles[groupName];
        if (groupName === "_default" || (idx === 0 && groups.length === 1)) {
          // Append to current section
          if (groupName !== "_default" && !newSections[sIdx].title) newSections[sIdx].title = groupName;
          newSections[sIdx].items = [...newSections[sIdx].items, ...items];
        } else {
          // Create new section
          if (groupName !== "_default") {
            newSections.push({ title: groupName, items: items, id: Math.random().toString(36).substr(2, 9) });
          } else {
            newSections[sIdx].items = [...newSections[sIdx].items, ...items];
          }
        }
      });
    }

    setFormData({ ...formData, designSections: newSections });
    if (e.target) e.target.value = '';
  };

  const handleAddSectionQuickly = (project) => {
    // 1. Load project into form
    setFormData({
      name: project.name || '',
      description: project.description || '',
      type: project.type || 'app',
      category: project.category || '',
      subtitle: project.subtitle || '',
      logoBase64: project.logoBase64 || '',
      links: project.links || { playStore: '', appStore: '', website: '' },
      designSections: project.designSections || []
    });
    setEditingId(project._id);
    
    // 2. Add the new section immediately
    setFormData(prev => ({
      ...prev,
      designSections: [...prev.designSections, { title: '', items: [], id: Math.random().toString(36).substr(2, 9) }]
    }));
    
    // 3. Open focused quick modal
    setIsQuickModalOpen(true);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      if (username === '1' && password === '1') {
        setIsAuthenticated(true);
      } else {
        alert('Invalid credentials');
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleEdit = (project) => {
    setFormData({
      name: project.name || '',
      description: project.description || '',
      type: project.type || 'app',
      category: project.category || '',
      subtitle: project.subtitle || '',
      logoBase64: project.logoBase64 || '',
      links: project.links || { playStore: '', appStore: '', website: '' },
      designSections: project.designSections || [{ title: '', items: [] }]
    });
    setEditingId(project._id);
    setActiveFormTab('general');
    setIsModalOpen(true);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!formData.logoBase64) return alert('Logo is mandatory!');
    setIsSubmitting(true);
    try {
      const url = '/api/projects';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        setActiveFormTab('general');
        setFormData({
          name: '', description: '', type: 'app', category: '', subtitle: '', logoBase64: '',
          links: { playStore: '', appStore: '', website: '' },
          designSections: [{ title: '', items: [] }]
        });
        fetchProjects();
        showToast('success', 'Project saved successfully!', editingId ? 'Changes have been pushed to the database.' : 'A new project has been created.');
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 413) {
          showToast('error', 'Payload Too Large', 'The total size of images exceeds the server limit. Try uploading fewer screenshots or lower resolution images.');
        } else {
          showToast('error', 'Save Failed', errData.error || 'The server encountered an error while saving. Please try again.');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Connection Error', 'Failed to reach the server. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setSelectedFolderId(null);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <div className="login-card mac-window">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <div className="login-actions">
              <button type="button" onClick={() => navigate('/')}>Cancel</button>
              <button type="submit" className="primary" disabled={isLoggingIn}>
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const selectedProject = projects.find(p => p._id === selectedFolderId);

  return (
    <div className="admin-dashboard">
      <div className="immersive-bg"></div>
      <div className="mac-window admin-window">
        <div className="window-header">
          <div className="traffic-lights">
            {selectedFolderId ? (
              <button className="header-back-button" onClick={() => setSelectedFolderId(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
              </button>
            ) : (
              <span className="traffic-dot red" onClick={() => navigate('/')}><span>✕</span></span>
            )}
          </div>
          <div className="window-title">
            {selectedFolderId ? selectedProject?.name : 'Admin Dashboard'}
          </div>
          {selectedFolderId ? (
            <div className="header-actions">
              <button className="header-edit-button" onClick={() => handleEdit(selectedProject)}>
                <span>✏️</span> Edit Project
              </button>
              <button className="header-delete-button" onClick={() => handleDelete(selectedProject._id)}>
                <span>🗑️</span> Delete Project
              </button>
            </div>
          ) : (
            <button className="add-project-btn" onClick={() => {
              setEditingId(null);
              setFormData({
                name: '', description: '', type: 'app', category: '', subtitle: '', logoBase64: '',
                links: { playStore: '', appStore: '', website: '' },
                designSections: [{ title: '', items: [{ title: '', imageBase64: '' }] }]
              });
              setIsModalOpen(true);
            }}>➕ Add Project</button>
          )}
        </div>
        <div className="window-body">
          {selectedFolderId ? (
            <div className="project-detail animate-in">
              <div className="project-header-row">
                <div className="project-logo-box">
                  <img src={selectedProject.logoBase64} alt="Logo" />
                </div>
                <div className="title-group">
                  <h1 className="window-hero-title">{selectedProject.name}</h1>
                  <p className="project-subtitle">{selectedProject.subtitle}</p>
                  <div className="meta-pill-container">
                    <span className="meta-pill">{selectedProject.type}</span>
                    <span className="meta-pill">{selectedProject.category}</span>
                  </div>
                </div>
              </div>

              <div className="content-section">
                <div className="what-we-like-text">{renderFormattedText(selectedProject.description)}</div>
                {selectedProject.designSections?.map((section, sIdx) => (
                  <div key={sIdx} className="content-section">
                    <h2 className="section-label">{section.title}</h2>
                    <div className={`screenshots-tray ${(selectedProject.type === 'website' || selectedProject.type === 'webapp') ? 'is-web' : ''}`}>
                      {section.items?.map((item, iIdx) => (
                        <div key={iIdx} className="screen-card">
                          <img src={item.imageBase64 || item.imageUrl} alt={item.title} className="screen-shot" />
                          <span className="screen-title">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="quick-add-section-wrapper">
                  <button type="button" className="add-section-btn" onClick={() => handleAddSectionQuickly(selectedProject)}>
                    + Add New Design Section
                  </button>
                </div>
              </div>

              {(selectedProject.links?.website || selectedProject.links?.playStore || selectedProject.links?.appStore) && (
                <div className="project-footer-links">
                  <div className="footer-divider"></div>
                  <span className="footer-section-label">LIVE NOW</span>
                  <div className="platform-links">
                    {selectedProject.links?.website && (
                      <a href={selectedProject.links.website} target="_blank" className="link-btn">
                        <div className="link-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        </div>
                        <div className="link-text">
                          <span className="link-label">VISIT OFFICIAL</span>
                          <span className="link-brand">Website</span>
                        </div>
                      </a>
                    )}
                    {selectedProject.links?.playStore && (
                      <a href={selectedProject.links.playStore} target="_blank" className="link-btn">
                        <div className="link-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5Z" fill="#00E676"/><path d="M16.92 15.23L13.69 12L16.92 8.77L20.56 10.85C21.41 11.34 21.41 12.67 20.56 13.15L16.92 15.23Z" fill="#F44336"/><path d="M13.69 12L3.84 2.15C4.01 2.07 4.2 2.03 4.41 2.03C4.73 2.03 5.04 2.11 5.31 2.27L16.92 8.77L13.69 12Z" fill="#2196F3"/><path d="M13.69 12L16.92 15.23L5.31 21.73C5.04 21.89 4.73 21.97 4.41 21.97C4.2 21.97 4.01 21.93 3.84 21.85L13.69 12Z" fill="#FFC107"/></svg>
                        </div>
                        <div className="link-text">
                          <span className="link-label">GET IT ON</span>
                          <span className="link-brand">Google Play</span>
                        </div>
                      </a>
                    )}
                    {selectedProject.links?.appStore && (
                      <a href={selectedProject.links.appStore} target="_blank" className="link-btn">
                        <div className="link-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71,19.5c-.83,1.24-1.71,2.45-3.1,2.48s-1.84-.85-3.44-.85-2.05.83-3.38.88-2.31-1.29-3.14-2.49c-1.69-2.45-2.98-6.93-1.25-9.95s3.59-3.8,5.43-3.8c1.78,0,3,1.06,4,1.06s2.51-1.28,4.6-1.07c.88.04,3.35.32,4.9,2.59-1.39.81-2.33,2.23-2.33,4.09,0,2.15,1.15,3.69,2.81,4.5a13.31,13.31,0,0,1-2.1,3.65ZM15.42,4.38a4.67,4.67,0,0,0,1.23-3.41,4.52,4.52,0,0,0-3.19,1.64,4.28,4.28,0,0,0-1.26,3.19c0,.08.01.16.02.24.16,0,.32.01.48.01a4.23,4.23,0,0,0,2.72-.68Z" /></svg>
                        </div>
                        <div className="link-text">
                          <span className="link-label">Download on the</span>
                          <span className="link-brand">App Store</span>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <h1 className="window-hero-title">Your Projects</h1>
              <div className="folder-grid">
                {loading ? (
                  [1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="folder-item skeleton-item">
                      <div className="folder-icon-wrapper skeleton"></div>
                      <div className="skeleton-text"></div>
                    </div>
                  ))
                ) : (
                  projects.map(p => (
                    <div key={p._id} className="folder-item" onClick={() => setSelectedFolderId(p._id)}>
                      <div className="folder-icon-wrapper"><img src="/folder.png" className="folder-img" /></div>
                      <span className="folder-name">{p.name}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content mac-window">
            <div className="window-header">
              <div className="window-title">{editingId ? `Edit ${formData.name}` : 'Add something new'}</div>
              <div className="traffic-lights"><span className="traffic-dot red" onClick={() => setIsModalOpen(false)}><span>✕</span></span></div>
            </div>
            <div className="window-body">
              <div className="form-tabs">
                <button type="button" className={activeFormTab === 'general' ? 'active' : ''} onClick={() => setActiveFormTab('general')}>1. General</button>
                <button type="button" className={activeFormTab === 'links' ? 'active' : ''} onClick={() => setActiveFormTab('links')}>2. Links</button>
                <button type="button" className={activeFormTab === 'content' ? 'active' : ''} onClick={() => setActiveFormTab('content')}>3. Content</button>
              </div>

              <form onSubmit={handleAddProject} className="modern-form">
                <div className="form-tab-content">
                  {activeFormTab === 'general' && (
                    <div className="tab-pane animate-in">
                      <div className="form-group">
                        <label>Project Name</label>
                        <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter project name" />
                      </div>
                      <div className="form-row">
                        <div className="form-group flex-1">
                          <label>Type</label>
                          <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                            <option value="app">Mobile App</option>
                            <option value="website">Website</option>
                            <option value="webapp">Web Application</option>
                          </select>
                        </div>
                        <div className="form-group flex-1">
                          <label>Category</label>
                          <input type="text" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} required placeholder="e.g. Fintech" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Subtitle (Tagline)</label>
                        <input type="text" value={formData.subtitle || ''} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} placeholder="Short catchphrase" />
                      </div>
                      <div className="form-group">
                        <label>Logo</label>
                        <div className="logo-upload-zone">
                          <input type="file" id="logo-input" accept="image/*" onChange={handleLogoUpload} required={!editingId} className="hidden-input" />
                          <label htmlFor="logo-input" className="file-box-trigger">
                            {formData.logoBase64 ? (
                              <div className="preview-wrap">
                                <img src={formData.logoBase64} alt="Logo" />
                                <span>Change Logo</span>
                              </div>
                            ) : (
                              <div className="placeholder-wrap">
                                <span>+</span>
                                <p>Upload Brand Logo</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFormTab === 'links' && (
                    <div className="tab-pane animate-in">
                      <div className="form-section-intro">
                        <h3>Platform Links</h3>
                        <p>Where can people find your project?</p>
                      </div>
                      <div className="form-group">
                        <label>Official Website URL</label>
                        <input type="text" value={formData.links?.website || ''} onChange={e => setFormData({ ...formData, links: { ...formData.links, website: e.target.value } })} placeholder="https://..." />
                      </div>
                      <div className="form-group">
                        <label>Google Play Store URL</label>
                        <input type="text" value={formData.links?.playStore || ''} onChange={e => setFormData({ ...formData, links: { ...formData.links, playStore: e.target.value } })} placeholder="https://..." />
                      </div>
                      <div className="form-group">
                        <label>Apple App Store URL</label>
                        <input type="text" value={formData.links?.appStore || ''} onChange={e => setFormData({ ...formData, links: { ...formData.links, appStore: e.target.value } })} placeholder="https://..." />
                      </div>
                    </div>
                  )}

                  {activeFormTab === 'content' && (
                    <div className="tab-pane animate-in">
                      <div className="form-group">
                        <label>Description (Rich Project Narrative)</label>
                        <textarea className="desc-textarea" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} required placeholder="Explain the problem you solved..." />
                      </div>

                      <div className="content-divider"></div>
                      <div className="form-section-intro">
                        <h3>Case Study Layout</h3>
                        <p>Group your screenshots into logical sections.</p>
                      </div>

                      <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleSectionDragEnd}
                      >
                        <SortableContext 
                          items={formData.designSections.map((s, idx) => s.id || `section-${idx}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          {formData.designSections.map((section, sIdx) => (
                            <SortableDesignSection 
                              key={section.id || `section-${sIdx}`}
                              section={section}
                              sIdx={sIdx}
                              formData={formData}
                              setFormData={setFormData}
                              handleDragEnd={handleDragEnd}
                              handleItemImageUpload={handleItemImageUpload}
                              sensors={sensors}
                              SortableImageRow={SortableImageRow}
                              onTitleChange={(newTitle) => {
                                const newSections = [...formData.designSections];
                                newSections[sIdx].title = newTitle;
                                setFormData({ ...formData, designSections: newSections });
                              }}
                              onRemoveSection={() => {
                                const newSections = formData.designSections.filter((_, i) => i !== sIdx);
                                setFormData({ ...formData, designSections: newSections });
                              }}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                      <button type="button" className="add-section-btn" onClick={() => setFormData({ ...formData, designSections: [...formData.designSections, { title: '', items: [] }] })}>
                        + Add New Design Section
                      </button>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                  <button type="submit" className="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Project' : 'Add Project')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isQuickModalOpen && (
        <div className="quick-modal-overlay">
          <div className="quick-modal">
            <div className="window-header">
              <div className="window-title">Add New Section to {formData.name}</div>
              <div className="traffic-lights">
                <span className="traffic-dot red" onClick={() => setIsQuickModalOpen(false)}><span>✕</span></span>
              </div>
            </div>
            <div className="window-body">
              <p className="quick-modal-intro">Add your title and screenshots for the new block.</p>
              <SortableDesignSection 
                section={formData.designSections[formData.designSections.length - 1]}
                sIdx={formData.designSections.length - 1}
                formData={formData}
                setFormData={setFormData}
                handleDragEnd={handleDragEnd}
                handleItemImageUpload={handleItemImageUpload}
                sensors={sensors}
                SortableImageRow={SortableImageRow}
                onTitleChange={(newTitle) => {
                  const newSections = [...formData.designSections];
                  newSections[newSections.length - 1].title = newTitle;
                  setFormData({ ...formData, designSections: newSections });
                }}
                onRemoveSection={() => {
                  setIsQuickModalOpen(false);
                }}
              />
            </div>
            <div className="quick-modal-footer">
              <button className="secondary-btn" onClick={() => setIsQuickModalOpen(false)}>Cancel</button>
              <button className="primary-btn" disabled={isSubmitting} onClick={async (e) => {
                await handleAddProject(e);
                setIsQuickModalOpen(false);
              }}>
                {isSubmitting ? 'Saving...' : 'Add Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="snackbar-container">
          <div className={`snackbar ${toast.type} ${toast.show ? '' : 'exit'}`}>
            <div className="snackbar-icon">
              {toast.type === 'success' ? '✅' : '❌'}
            </div>
            <div className="snackbar-content">
              <span className="snackbar-title">{toast.message}</span>
              {toast.details && <span className="snackbar-details">{toast.details}</span>}
            </div>
            <button className="snackbar-close" onClick={() => setToast(prev => ({ ...prev, show: false }))}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Portfolio />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/:projectSlug" element={<Portfolio />} />
    </Routes>
  );
};

export default App;
