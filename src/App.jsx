import React, { useState, useEffect } from 'react';

const App = () => {
  const [activeTab, setActiveTab] = useState('works');
  const [isWindowVisible, setIsWindowVisible] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const folders = [
    { id: 1, name: 'LIVO', description: 'Smart logistics and delivery platform.' },
    { id: 2, name: 'Arikil Ai', description: 'Personalized AI assistant for daily tasks.' },
    { id: 3, name: 'Vat Dual Price', description: 'Dynamic tax calculation engine for e-commerce.' },
    { id: 4, name: 'Phonecase', description: 'Interactive 3D phone case design tool.' },
    { id: 5, name: 'Zabiyo', description: 'Premium fashion e-commerce experience.' },
    { id: 6, name: 'Life Partner Again', description: 'Deep connection dating platform.' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError('Mode: Offline Demonstration');
      setProjects([
        { _id: '1', title: 'Spatial Audio Design', description: 'Immersive soundscape design for VR environments.', imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800', tags: ['VR', 'Audio'] },
        { _id: '2', title: 'Haptic Feedback Interface', description: 'Tactile response system for medical devices.', imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800', tags: ['Hardware', 'Haptics'] },
        { _id: '3', title: 'Neural Dashboard', description: 'A brain-computer interface monitoring dashboard.', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800', tags: ['BCI', 'Dashboards'] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'about':
        return (
          <section className="info-section">
            <h1 className="window-hero-title">Product Designer</h1>
            <p className="window-hero-subtitle">Visionary systems. Human-centric depth. Immersive details.</p>
            <h2>About Me</h2>
            <p>I am a visionary product designer focusing on the intersection of human psychology and high-fidelity interfaces. My mission is to build products that feel invisible yet indispensable.</p>
            <div className="bio-stats">
              <div className="stat"><span>8+</span> Years Exp</div>
              <div className="stat"><span>40+</span> Shipped</div>
            </div>
          </section>
        );
      case 'works':
        if (selectedFolder) {
          const folder = folders.find(f => f.id === selectedFolder);
          return (
            <div className="project-detail">
              <h1 className="window-hero-title">{folder.name}</h1>
              <p className="window-hero-subtitle">{folder.description}</p>
              <div className="project-content">
                <div className="placeholder-hero">
                  <img src="/bg-3.png" alt="Project" />
                </div>
                <div className="project-meta">
                  <div className="meta-item">
                    <span className="meta-label">Role</span>
                    <span className="meta-value">Lead Product Designer</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Year</span>
                    <span className="meta-value">2023 - 2024</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <>
            <h1 className="window-hero-title">Things I Designed</h1>
            <div className="folder-grid">
              {folders.map(folder => (
                <div 
                  key={folder.id} 
                  className="folder-item" 
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className="folder-icon-wrapper">
                    <img src="/folder.png" alt="Folder" className="folder-img" />
                  </div>
                  <span className="folder-name">{folder.name}</span>
                </div>
              ))}
            </div>
          </>
        );
      case 'writings':
        return (
          <section className="info-section">
            <h2>My Writings</h2>
            <div className="writing-list">
              <div className="writing-item">
                <span className="date">Oct 2023</span>
                <h3>The Future of Spatial Computing</h3>
                <p>Exploring how visionOS is changing the way we perceive digital depth.</p>
              </div>
              <div className="writing-item">
                <span className="date">Aug 2023</span>
                <h3>Designing for the subconscious</h3>
                <p>Why micro-interactions are the heartbeat of modern UX.</p>
              </div>
            </div>
          </section>
        );
      case 'learning':
        return (
          <section className="info-section">
            <h2>Learning Resources</h2>
            <p>A curated collection of tools and frameworks I use to sharpen my craft.</p>
            <div className="resource-grid">
              <div className="resource-tag">Figma Foundations</div>
              <div className="resource-tag">React for Designers</div>
              <div className="resource-tag">Three.js Mastery</div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <main onClick={() => setIsWindowVisible(false)}>
        <div className="immersive-bg"></div>
        
        {isWindowVisible && (
          <div 
            className={`mac-window ${isFullScreen ? 'full-screen' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="window-header">
              <div className="traffic-lights">
                {selectedFolder && activeTab === 'works' ? (
                  <button 
                    className="header-back-button" 
                    onClick={() => setSelectedFolder(null)}
                    title="Back to Works"
                  >
                    <span>←</span>
                  </button>
                ) : (
                  <>
                    <span className="traffic-dot red" onClick={() => setIsWindowVisible(false)}>
                      <span>✕</span>
                    </span>
                    <span className="traffic-dot yellow" onClick={() => setIsFullScreen(false)}>
                      <span>−</span>
                    </span>
                    <span className="traffic-dot green" onClick={() => setIsFullScreen(!isFullScreen)}>
                      <span>+</span>
                    </span>
                  </>
                )}
              </div>
              <div className="window-title">
                {selectedFolder && activeTab === 'works' ? (
                  folders.find(f => f.id === selectedFolder)?.name
                ) : (
                  activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                )}
              </div>
              <div className="window-actions-placeholder" style={{ width: '52px' }}></div>
            </div>
            <div className="window-body">
              {renderContent()}
            </div>
          </div>
        )}
      </main>

      <div className="dock-container">
        <nav className="dock">
          <button 
            className={`dock-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => { setActiveTab('about'); setIsWindowVisible(true); }}
          >
            <img src="/Profile.png" alt="About" className="dock-icon" />
            <span className="label">About</span>
          </button>
          <button 
            className={`dock-item ${activeTab === 'works' ? 'active' : ''}`}
            onClick={() => { setActiveTab('works'); setIsWindowVisible(true); }}
          >
            <img src="/Works.png" alt="Works" className="dock-icon" />
            <span className="label">Works</span>
          </button>
          <button 
            className={`dock-item ${activeTab === 'writings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('writings'); setIsWindowVisible(true); }}
          >
            <img src="/Writings.png" alt="Writings" className="dock-icon" />
            <span className="label">Writings</span>
          </button>
          <button 
            className={`dock-item ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => { setActiveTab('learning'); setIsWindowVisible(true); }}
          >
            <img src="/Learnings.png" alt="Learning" className="dock-icon" />
            <span className="label">Learning</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;
