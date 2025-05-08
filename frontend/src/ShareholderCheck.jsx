import { useState } from 'react';
import {
  FaSearch,
  FaUser,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaChevronRight,
  FaTimesCircle,
} from 'react-icons/fa';

const ShareholderCheck = ({ setCurrentView, setShareholderData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [selectedShareholder, setSelectedShareholder] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setError('');
    setLoading(true);
    setResults(null);
    setSelectedShareholder(null);

    try {
      const response = await fetch('http://localhost:3001/api/check-shareholder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm }),
      });

      const data = await response.json();

      if (data.status === 'account_match') {
        setSelectedShareholder(data.shareholder);
      } else if (data.status === 'name_matches') {
        setResults(data.shareholders);
      } else {
        setError(data.message || 'No matching shareholders found');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedShareholder) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acno: selectedShareholder.acno,
          email: selectedShareholder.email,
          phone_number: selectedShareholder.phone_number,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setShareholderData(selectedShareholder);
        setCurrentView('success');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setResults(null);
    setSelectedShareholder(null);
    setSearchTerm('');
  };

  return (
    <div className="verification-container">
      <div className="illustration">
        <img src="/imgs/voting-illustration.jpg" alt="Voting Illustration" />
      </div>

      <div className="verification-form">
        {!selectedShareholder && !results ? (
          <>
            <form onSubmit={handleSearch}>
              <h2>Shareholder Verification</h2>
              <p className="form-description">Search by name or account number</p>

              <div className="form-group">
                <div className="input-with-icon">
                  <FaSearch className="input-icon" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Name or Account Number"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !searchTerm.trim()}>
                {loading ? <span className="spinner"></span> : <><FaSearch /> Search</>}
              </button>
            </form>

            {error && <p className="error">{error}</p>}
          </>
        ) : selectedShareholder ? (
          <div className="verification-success">
            <h2>Verify Your Details</h2>
            <div className="shareholder-details">
              <p><FaUser /> <strong>Name:</strong> {selectedShareholder.name}</p>
              <p><FaIdCard /> <strong>Account No:</strong> {selectedShareholder.acno}</p>
              <p><FaEnvelope /> <strong>Email:</strong> {selectedShareholder.email}</p>
              <p><FaPhone /> <strong>Phone:</strong> {selectedShareholder.phone_number}</p>
            </div>

            <div className="action-buttons">
              <button onClick={resetSearch} className="secondary-btn">
                Back to Search
              </button>
              <button onClick={handleRegister} disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Confirm Registration'}
              </button>
            </div>
          </div>
        ) : (
          <div className="results-container">
            <h2>Select Your Account</h2>
            <div className="results-table">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Account No</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((sh) => (
                      <tr key={sh.acno}>
                        <td>{sh.name}</td>
                        <td>{sh.acno}</td>
                        <td>
                          <button
                            onClick={() => setSelectedShareholder(sh)}
                            className="select-btn"
                          >
                            Select <FaChevronRight />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={resetSearch} className="secondary-btn">
              Back to Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareholderCheck;
