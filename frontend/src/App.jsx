import { useState } from 'react'
import ShareholderCheck from './ShareholderCheck'
import Header from './Header'
import Footer from './Footer'

function App() {
  const [currentView, setCurrentView] = useState('check')
  const [shareholderData, setShareholderData] = useState(null)

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        {currentView === 'check' && (
          <ShareholderCheck 
            setCurrentView={setCurrentView}
            setShareholderData={setShareholderData}
          />
        )}

        {currentView === 'success' && (
          <div className="success-view">
            <h2>✅ Pre Registration Successful!</h2>
            <p>Confirmation email sent to {shareholderData?.email}</p>
            <p>Please check your email to complete registration.</p>
            <button onClick={() => setCurrentView('check')}>Back to Home</button>
          </div>
        )}

        {currentView === 'error' && (
          <div className="error-view">
            <h2>❌ Registration Failed</h2>
            <p>Please try again or contact support.</p>
            <button onClick={() => setCurrentView('check')}>Try Again</button>
          </div>
        )}
      </main>

      {/* <Footer /> */}
    </div>
  )
}

export default App