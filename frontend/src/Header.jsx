import { useState } from "react";
import { FaBook, FaHeadset, FaDownload, FaBars, FaTimes } from "react-icons/fa";

export default function Header() {
  const [showManual, setShowManual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const downloadManual = () => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = '/manual.pdf'; // Make sure this file exists in your public folder
    link.download = 'E-Voting-Manual.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="header">
      <div className="logo-container">
        <img src="/logo.png" alt="E-Voting Logo" className="logo" />
        <h4>E-Voting Registration Portal</h4>
      </div>
      
      {/* Mobile menu button */}
      <button 
        className="mobile-menu-button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      <nav className={`nav ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        <button 
          className="nav-link"
          onClick={downloadManual}
        >
          <FaBook className="icon" /> E-Voting Manual
        </button>
        <a href="mailto:registrars@apel.com.ng" className="nav-link">
          <FaHeadset className="icon" /> Contact Support
        </a>
      </nav>
    </header>
  );
}