import { useMemo, useState } from 'react';

const projects = [
  {
    id: 1,
    name: 'Greenfield Enclave',
    location: 'Yamuna Expressway',
    type: 'Residential',
    area: '100–200 sq. yd.',
    minArea: 100,
    maxArea: 200,
    price: 'Price on request',
    tag: 'Residential plots',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=85',
    description: 'A demo listing for residential land buyers looking for a planned community.',
  },
  {
    id: 2,
    name: 'Aaranya Greens',
    location: 'Greater Noida',
    type: 'Residential',
    area: '120–250 sq. yd.',
    minArea: 120,
    maxArea: 250,
    price: 'Price on request',
    tag: 'Green surroundings',
    image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1100&q=85',
    description: 'A demo listing with room to compare plot sizes and location preferences.',
  },
  {
    id: 3,
    name: 'Horizon Trade Park',
    location: 'Noida',
    type: 'Commercial',
    area: '150–500 sq. yd.',
    minArea: 150,
    maxArea: 500,
    price: 'Price on request',
    tag: 'Commercial land',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1100&q=85',
    description: 'A sample commercial plot card; replace it with verified availability and details.',
  },
];

const locations = ['All locations', 'Yamuna Expressway', 'Greater Noida', 'Noida'];
const types = ['All types', 'Residential', 'Commercial'];
const sizes = ['Any size', 'Up to 150 sq. yd.', 'Over 150 sq. yd.'];

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="arrow-icon"><path d="M4 10h11M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState('All locations');
  const [type, setType] = useState('All types');
  const [size, setSize] = useState('Any size');
  const [enquiryProject, setEnquiryProject] = useState('General enquiry');
  const emptyForm = { name: '', phone: '', email: '', address: '', city: '', postalCode: '', interest: 'Residential plots', budget: '', plotSize: '', preferredContact: 'Phone', message: '', consent: false, website: '' };
  const [form, setForm] = useState(emptyForm);
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const locationMatches = location === 'All locations' || project.location === location;
    const typeMatches = type === 'All types' || project.type === type;
    const sizeMatches = size === 'Any size' || (size === 'Up to 150 sq. yd.' && project.minArea <= 150) || (size === 'Over 150 sq. yd.' && project.maxArea > 150);
    return locationMatches && typeMatches && sizeMatches;
  }), [location, type, size]);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openEnquiry = (projectName = 'General enquiry') => {
    setEnquiryProject(projectName);
    setForm((current) => ({ ...current, message: projectName === 'General enquiry' ? current.message : `I would like more information about ${projectName}.` }));
    scrollTo('contact');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormMessage('');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, selectedListing: enquiryProject, source: 'Website enquiry form' }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Your enquiry could not be saved. Please try again.');
      setFormMessage(`Thank you, ${form.name}. Your enquiry was saved successfully. Our team can follow up using the contact details you provided.`);
      setForm(emptyForm);
      setEnquiryProject('General enquiry');
    } catch (error) {
      setFormMessage(error.message || 'We could not connect to the server. Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="site-shell">
      <div className="top-strip"><span>Thoughtful property guidance across Delhi NCR</span><span className="top-strip-right">Site visits by appointment <span className="top-dot">●</span></span></div>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Landora home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><span></span><span></span><span></span></span>
          <span className="brand-word">LANDORA<small>LAND & LIVING</small></span>
        </a>
        <button className="mobile-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#properties" onClick={() => setMenuOpen(false)}>Explore plots</a>
          <a href="#why-us" onClick={() => setMenuOpen(false)}>Why Landora</a>
          <a href="#process" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          <button className="nav-cta" onClick={() => openEnquiry()}>Talk to an advisor <ArrowIcon /></button>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-image" aria-hidden="true"></div>
          <div className="hero-shade"></div>
          <div className="hero-content container">
            <p className="eyebrow eyebrow-light"><span className="eyebrow-line"></span> YOUR NEXT CHAPTER STARTS HERE</p>
            <h1>Find the right plot.<br /><em>Build what’s next.</em></h1>
            <p className="hero-copy">Explore land opportunities across Delhi NCR with clearer information, helpful guidance, and a search built around your plans.</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => scrollTo('properties')}>Explore available plots <ArrowIcon /></button>
              <button className="button button-ghost" onClick={() => openEnquiry()}>Plan a site visit <span className="play-icon">↗</span></button>
            </div>
            <div className="hero-proof"><span className="proof-check">✓</span> Clear details <span className="proof-separator">/</span> Personal guidance <span className="proof-separator">/</span> No-pressure enquiries</div>
          </div>
          <div className="hero-caption"><span>PROPERTY, WITH A CLEARER PERSPECTIVE</span><span>01 — 03</span></div>
        </section>

        <section className="search-section" aria-label="Find a plot">
          <div className="search-card">
            <div className="search-intro"><span className="search-kicker">START YOUR SEARCH</span><h2>What are you looking for?</h2></div>
            <label className="filter-field"><span>Preferred location</span><select value={location} onChange={(event) => setLocation(event.target.value)}>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="filter-field"><span>Plot category</span><select value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="filter-field"><span>Plot size</span><select value={size} onChange={(event) => setSize(event.target.value)}>{sizes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <button className="button button-dark search-button" onClick={() => scrollTo('properties')}>Find plots <ArrowIcon /></button>
          </div>
        </section>

        <section className="intro-section section-pad container" id="why-us">
          <div className="intro-heading"><p className="eyebrow"><span className="eyebrow-line"></span> A MORE THOUGHTFUL WAY TO BUY LAND</p><h2>Big decisions deserve<br /><em>better information.</em></h2></div>
          <div className="intro-copy"><p>Buying land is about more than a pin on a map. It is about understanding the location, the paperwork, the practical details, and whether an opportunity fits your plans.</p><p>Our aim is to make your shortlist easier to navigate, one considered step at a time.</p><a className="text-link" href="#process">See how we help <ArrowIcon /></a></div>
        </section>

        <section className="properties-section section-pad" id="properties">
          <div className="container">
            <div className="section-heading-row">
              <div><p className="eyebrow"><span className="eyebrow-line"></span> A PLACE TO BEGIN</p><h2>Explore <em>plot opportunities</em></h2><p className="section-subtitle">Browse sample listings, then enquire for current availability and full details.</p></div>
              <div className="listing-count"><strong>{filteredProjects.length.toString().padStart(2, '0')}</strong><span>LISTINGS<br />MATCH YOUR SEARCH</span></div>
            </div>
            <div className="active-filters"><span>Showing</span><b>{location}</b><span>·</span><b>{type}</b><button onClick={() => { setLocation('All locations'); setType('All types'); setSize('Any size'); }}>Reset filters ×</button></div>
            {filteredProjects.length ? <div className="property-grid">{filteredProjects.map((project) => <article className="property-card" key={project.id}>
              <div className="property-image-wrap"><img src={project.image} alt={`${project.name} landscape`} loading="lazy" /><span className="property-tag">{project.tag}</span><button className="image-arrow" aria-label={`Enquire about ${project.name}`} onClick={() => openEnquiry(project.name)}><ArrowIcon /></button></div>
              <div className="property-details"><div className="property-location"><span className="location-pin">⌖</span>{project.location}</div><h3>{project.name}</h3><p className="property-description">{project.description}</p><div className="property-specs"><span><small>PLOT AREA</small><b>{project.area}</b></span><span><small>CATEGORY</small><b>{project.type}</b></span></div><div className="property-bottom"><div><small>PRICE</small><strong>{project.price}</strong></div><button className="text-link" onClick={() => openEnquiry(project.name)}>Enquire <ArrowIcon /></button></div><p className="demo-note">Illustrative demo listing · Verify all details before purchase</p></div>
            </article>)}</div> : <div className="empty-state"><h3>No matching sample listings</h3><p>Try another location or property category.</p><button className="button button-dark" onClick={() => { setLocation('All locations'); setType('All types'); }}>Show all listings</button></div>}
            <div className="disclaimer">All listings on this starter site are illustrative. Confirm ownership, approvals, land use, title documents, pricing, and availability independently before making a purchase.</div>
          </div>
        </section>

        <section className="feature-band section-pad">
          <div className="container feature-layout"><div className="feature-image"><img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=85" alt="Sunlight across a green landscape" loading="lazy"/><div className="image-stamp"><span>LANDORA</span><small>SPACE TO GROW</small></div></div><div className="feature-copy"><p className="eyebrow eyebrow-light"><span className="eyebrow-line"></span> GOOD DECISIONS START WITH CLARITY</p><h2>Find a place that<br /><em>fits your plans.</em></h2><p>Whether you are exploring a future home, comparing investment options, or looking for commercial land, start with the questions that matter to you.</p><div className="feature-points"><div><span className="feature-number">01</span><span><b>Understand the details</b><small>Ask for plot measurements, documents, and applicable approvals.</small></span></div><div><span className="feature-number">02</span><span><b>Compare with confidence</b><small>Review location, access, budget, and your intended use.</small></span></div><div><span className="feature-number">03</span><span><b>Take the next step</b><small>Arrange a discussion or site visit when you are ready.</small></span></div></div><button className="button button-light" onClick={() => openEnquiry()}>Speak with our team <ArrowIcon /></button></div></div>
        </section>

        <section className="process-section section-pad container" id="process"><div className="process-heading"><p className="eyebrow"><span className="eyebrow-line"></span> SIMPLE, STEP BY STEP</p><h2>Your search, <em>made clearer.</em></h2></div><div className="process-grid"><div className="process-item"><span className="process-icon">01</span><h3>Share your priorities</h3><p>Tell us your preferred area, plot size, use, and budget range.</p></div><div className="process-item"><span className="process-icon">02</span><h3>Review your options</h3><p>Shortlist relevant properties and ask questions about their details.</p></div><div className="process-item"><span className="process-icon">03</span><h3>Arrange a site visit</h3><p>Visit shortlisted locations and complete your own due diligence.</p></div></div></section>

        <section className="contact-section section-pad" id="contact"><div className="container contact-layout"><div className="contact-copy"><p className="eyebrow eyebrow-light"><span className="eyebrow-line"></span> LET'S TALK ABOUT YOUR PLANS</p><h2>A good place to start<br /><em>is a conversation.</em></h2><p>Share your contact details and property preferences. Your enquiry is saved by the website backend and added to the Excel lead register for your authorized team.</p><div className="contact-note"><span className="contact-note-icon">↗</span><span><b>What happens next?</b><small>Your details are available to an authorized administrator for follow-up. They are not shown in the public website.</small></span></div></div><form className="contact-form" onSubmit={handleSubmit}><div className="form-heading"><span>PROPERTY ENQUIRY</span><h3>How can we help?</h3></div>
          <div className="form-grid">
            <label>Full name *<input required minLength="2" maxLength="100" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter your full name" /></label>
            <label>Phone number *<input required type="tel" inputMode="tel" pattern="[0-9+() -]{8,18}" minLength="8" maxLength="18" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="e.g. +91 98765 43210" /></label>
            <label>Email address<input type="email" maxLength="254" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" /></label>
            <label>City<input maxLength="100" autoComplete="address-level2" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Your city" /></label>
            <label className="form-span-2">Address<input maxLength="250" autoComplete="street-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="House / street / locality (optional)" /></label>
            <label>PIN code<input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoComplete="postal-code" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} placeholder="6-digit PIN" /></label>
            <label>Interested in<select value={form.interest} onChange={(event) => setForm({ ...form, interest: event.target.value })}><option>Residential plots</option><option>Commercial plots</option><option>Investment options</option><option>Site visit</option><option>Other property enquiry</option></select></label>
            <label>Budget range<select value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })}><option value="">Select budget (optional)</option><option>Below ₹10 lakh</option><option>₹10–25 lakh</option><option>₹25–50 lakh</option><option>₹50 lakh–₹1 crore</option><option>₹1 crore+</option><option>Discuss with advisor</option></select></label>
            <label>Preferred plot size<input maxLength="80" value={form.plotSize} onChange={(event) => setForm({ ...form, plotSize: event.target.value })} placeholder="e.g. 100 sq. yd." /></label>
            <label>Preferred contact method<select value={form.preferredContact} onChange={(event) => setForm({ ...form, preferredContact: event.target.value })}><option>Phone</option><option>WhatsApp</option><option>Email</option></select></label>
            <label className="form-span-2">Message<textarea rows="3" maxLength="1500" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder={`Selected: ${enquiryProject}. Tell us what you are looking for (optional).`} /></label>
          </div>
          <label className="honeypot" aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label>
          <label className="consent-row"><input type="checkbox" required checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} /><span>I agree to be contacted regarding this enquiry and understand my details will be used for follow-up. *</span></label>
          <button className="button button-primary form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving enquiry…' : 'Submit enquiry'} <ArrowIcon /></button>
          {formMessage && <p className={`form-message ${formMessage.startsWith('Thank you') ? 'form-message-success' : 'form-message-error'}`} role="status">{formMessage}</p>}
          <small className="privacy-copy">Fields marked * are required. Store and use personal details only for the purpose disclosed to the visitor. Publish a privacy policy before going live.</small></form></div></section>
      </main>

      <footer className="site-footer"><div className="container footer-top"><a className="brand brand-footer" href="#home"><span className="brand-mark"><span></span><span></span><span></span></span><span className="brand-word">LANDORA<small>LAND & LIVING</small></span></a><p>Find your place. Build what’s next.</p><a className="back-top" href="#home">Back to top ↑</a></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Landora. Real estate website starter.</span><span>Demo listings must be replaced before publishing.</span></div></footer>
      <a className="mobile-contact" href="#contact" onClick={() => setMenuOpen(false)}><span>✳</span> Enquire now <ArrowIcon /></a>
    </div>
  );
}

export default App;
