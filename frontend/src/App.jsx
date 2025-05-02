
import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "prismjs/themes/prism-tomorrow.css";
import prism from "prismjs";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import "./styles/editor.css";
import axios from "axios";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Navigation from "./components/Navigation";
import CodeEditor from "./components/CodeEditor";

function App() {
  const [code, setCode] = useState(`def sum():  \n  return a + b \n`);
  const [review, setReview] = useState("");
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('reviewHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showHistory, setShowHistory] = useState(() => {
    const savedShowHistory = localStorage.getItem('showHistory');
    return savedShowHistory ? JSON.parse(savedShowHistory) : false;
  });
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('editor'); // 'editor' or 'review'

  const editorRef = useRef(null);

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('reviewHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('showHistory', JSON.stringify(showHistory));
  }, [showHistory]);

  useEffect(() => {
    prism.highlightAll();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  async function reviewCode() {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post(
        "http://localhost:3000/ai/get-review",
        { code },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.review) {
        setReview(response.data.review);
        const newHistoryItem = {
          code,
          review: response.data.review,
          timestamp: new Date().toLocaleString()
        };
        setHistory(prev => [...prev, newHistoryItem]);
        
        // If on mobile, switch to review tab after generating
        if (isMobileView) {
          setActiveMobileTab('review');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Review code error:', error);
      if (error.response?.status === 401) {
        handleLogout();
        setReview('Error: Please log in again');
      } else {
        setReview('Error: ' + (error.message || 'Failed to get review'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  const CodeReviewer = () => {
    if (!user) {
      return <Navigate to="/login" />;
    }

    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <div className="flex-1 p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full max-w-7xl mx-auto">
            {/* History Sidebar - Collapses to top bar on mobile */}
            <div className={`w-full lg:w-72 flex-shrink-0 ${isMobileView && !showHistory ? 'mb-4' : ''}`}>
              <div className="flex flex-col gap-2 mb-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
                >
                  {showHistory ? "Hide History" : "Show History"}
                </button>
                {showHistory && history.length > 0 && (
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('reviewHistory');
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
                  >
                    Clear All History
                  </button>
                )}
              </div>
              {showHistory && (
                <div className="w-full bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg border border-gray-700 overflow-auto max-h-[60vh] lg:max-h-[calc(100vh-12rem)]">
                  <h2 className="text-xl font-bold mb-4 text-blue-400">Review History</h2>
                  {history.length === 0 ? (
                    <p className="text-gray-400">No previous reviews yet</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item, index) => (
                        <div key={index} className="w-full border-b border-gray-700 pb-2">
                          <div
                            className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200"
                            onClick={() => setExpandedHistory(expandedHistory === index ? null : index)}
                          >
                            <div className="text-sm font-bold text-blue-400 truncate">
                              {item.code.split('\n')[0].trim() || "Code Review"}
                            </div>
                            <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                              {item.timestamp}
                            </div>
                          </div>
                          {expandedHistory === index && (
                            <div className="w-full mt-2 pl-2 border-l-2 border-blue-500">
                              <div className="w-full text-sm font-mono bg-gray-900 p-2 rounded mb-2 overflow-x-auto">
                                {item.code}
                              </div>
                              <div className="w-full text-sm">
                                <Markdown rehypePlugins={[rehypeHighlight]}>{item.review}</Markdown>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Tab Toggles */}
            {isMobileView && (
              <div className="flex w-full bg-gray-800 rounded-lg mb-4 overflow-hidden">
                <button 
                  className={`flex-1 py-3 px-4 text-center font-medium ${activeMobileTab === 'editor' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => setActiveMobileTab('editor')}
                >
                  Code Editor
                </button>
                <button 
                  className={`flex-1 py-3 px-4 text-center font-medium ${activeMobileTab === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => setActiveMobileTab('review')}
                >
                  Review
                </button>
              </div>
            )}

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 flex-1">
              {/* Code Editor */}
              <div className={`w-full lg:w-1/2 ${isMobileView && activeMobileTab !== 'editor' ? 'hidden' : ''}`}>
                <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg border border-gray-700 h-full flex flex-col">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Upload Code File
                    </label>
                    <input
                      type="file"
                      accept=".js, .py, .css, .cpp, .cs, .ts, .html, .json, .java"
                      onChange={handleFileUpload}
                      className="w-full text-sm text-gray-400 cursor-pointer bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    />
                  </div>
                  <div className="flex-1 border border-gray-600 rounded-lg bg-gray-900 overflow-hidden min-h-[300px] md:min-h-[400px]">
                    <CodeEditor
                      value={code}
                      onChange={handleCodeChange}
                    />
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={reviewCode}
                      disabled={isLoading}
                      className={`inline-flex items-center justify-center min-w-[200px] max-w-full px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-500 hover:to-blue-600 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-xl whitespace-nowrap ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? 'Generating Review...' : 'Review Code 🤖'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Review Section */}
              <div className={`w-full lg:w-1/2 ${isMobileView && activeMobileTab !== 'review' ? 'hidden' : ''}`}>
                <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg border border-gray-700 h-full flex flex-col">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 md:p-4 rounded-lg mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-white text-center">Current Review</h2>
                  </div>
                  <div className="flex-1 overflow-auto prose prose-invert max-w-none">
                    {review ? (
                      <Markdown
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          h1: ({ node, ...props }) => <h1 className="text-xl md:text-2xl font-bold text-blue-400 mb-4" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-lg md:text-xl font-bold text-blue-300 mb-3" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                          li: ({ node, ...props }) => <li className="mb-2" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                          code: ({ node, ...props }) => <code className="bg-gray-700 px-2 py-1 rounded" {...props} />
                        }}
                      >
                        {review}
                      </Markdown>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 text-lg">No review available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navigation user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/code-reviewer" /> : <Login onLogin={handleLogin} />} />
          <Route path="/signup" element={user ? <Navigate to="/code-reviewer" /> : <Signup onLogin={handleLogin} />} />
          <Route path="/code-reviewer" element={<CodeReviewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;