import React, { useState, useEffect } from 'react';

const App = () => {
  const [activeTab, setActiveTab] = useState('works');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <h2>About Me</h2>
            <p>I am a visionary product designer focusing on the intersection of human psychology and high-fidelity interfaces. My mission is to build products that feel invisible yet indispensable.</p>
            <div className="bio-stats">
              <div className="stat"><span>8+</span> Years Exp</div>
              <div className="stat"><span>40+</span> Shipped</div>
            </div>
          </section>
        );
      case 'works':
        return (
          <div className="grid">
            {!loading && projects.map(project => (
              <div key={project._id} className="card">
                <img src={project.imageUrl} alt={project.title} />
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="tags">
                  {project.tags?.map(tag => <span key={tag} className="tag">{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
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
      <main>
        <div className="immersive-bg"></div>
        
        <section className="hero">
          <h1>Product Designer</h1>
          <p>Visionary systems. Human-centric depth. Immersive details.</p>
        </section>

        <div className="content-container">
          {renderContent()}
        </div>
      </main>

      <div className="dock-container">
        <nav className="dock">
          <button 
            className={`dock-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <img src="/Profile.png" alt="About" className="dock-icon" />
            <span className="label">About</span>
          </button>
          <button 
            className={`dock-item ${activeTab === 'works' ? 'active' : ''}`}
            onClick={() => setActiveTab('works')}
          >
            <img src="/Works.png" alt="Works" className="dock-icon" />
            <span className="label">Works</span>
          </button>
          <button 
            className={`dock-item ${activeTab === 'writings' ? 'active' : ''}`}
            onClick={() => setActiveTab('writings')}
          >
            <img src="/Writings.png" alt="Writings" className="dock-icon" />
            <span className="label">Writings</span>
          </button>
          <button 
            className={`dock-item ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => setActiveTab('learning')}
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
