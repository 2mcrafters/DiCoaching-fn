import { useState, useEffect } from 'react';
import apiService from '@/services/api';

export default function ConnectionTest() {
  const [results, setResults] = useState({
    backendHealth: { status: 'testing', message: '' },
    termsAPI: { status: 'testing', message: '', count: 0 },
    categoriesAPI: { status: 'testing', message: '', count: 0 },
    commentsAPI: { status: 'testing', message: '' },
    decisionsAPI: { status: 'testing', message: '' },
    likesAPI: { status: 'testing', message: '' },
  });

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    // Test 1: Backend Health
    try {
      const response = await fetch('http://localhost:5000/api/test-db');
      const data = await response.json();
      setResults(prev => ({
        ...prev,
        backendHealth: {
          status: 'success',
          message: `Database connected. Users: ${data.stats.users}, Terms: ${data.stats.terms}`
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        backendHealth: { status: 'error', message: error.message }
      }));
    }

    // Test 2: Terms API through apiService
    try {
      const data = await apiService.getTerms({ limit: 5 });
      const terms = data.data || data.terms || data;
      setResults(prev => ({
        ...prev,
        termsAPI: {
          status: 'success',
          message: `Retrieved ${terms.length} terms`,
          count: terms.length,
          sample: terms[0]?.terme || terms[0]?.term
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        termsAPI: { status: 'error', message: error.message, count: 0 }
      }));
    }

    // Test 3: Categories API
    try {
      const data = await apiService.getCategories();
      const categories = data.data || data;
      setResults(prev => ({
        ...prev,
        categoriesAPI: {
          status: 'success',
          message: `Retrieved ${categories.length} categories`,
          count: categories.length
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        categoriesAPI: { status: 'error', message: error.message, count: 0 }
      }));
    }

    // Test 4: Comments API (if we have a term)
    try {
      const data = await apiService.getComments(1); // Test with term ID 1
      setResults(prev => ({
        ...prev,
        commentsAPI: {
          status: 'success',
          message: `Comments API working (${data.data?.length || 0} comments)`
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        commentsAPI: { status: 'error', message: error.message }
      }));
    }

    // Test 5: Likes API
    try {
      const data = await apiService.getLikes(1); // Test with term ID 1
      setResults(prev => ({
        ...prev,
        likesAPI: {
          status: 'success',
          message: `Likes API working (count: ${data.count || 0})`
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        likesAPI: { status: 'error', message: error.message }
      }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'testing': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
            🔍 System Connection Test
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Frontend ↔ Backend ↔ Database
          </p>

          <div className="space-y-4">
            {/* Backend Health */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(results.backendHealth.status)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Backend Health Check</h3>
                    <p className={`text-sm ${getStatusColor(results.backendHealth.status)}`}>
                      {results.backendHealth.message || 'Testing...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms API */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(results.termsAPI.status)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Terms API</h3>
                    <p className={`text-sm ${getStatusColor(results.termsAPI.status)}`}>
                      {results.termsAPI.message || 'Testing...'}
                    </p>
                    {results.termsAPI.sample && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sample: {results.termsAPI.sample}
                      </p>
                    )}
                  </div>
                </div>
                {results.termsAPI.count > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {results.termsAPI.count} records
                  </span>
                )}
              </div>
            </div>

            {/* Categories API */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(results.categoriesAPI.status)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Categories API</h3>
                    <p className={`text-sm ${getStatusColor(results.categoriesAPI.status)}`}>
                      {results.categoriesAPI.message || 'Testing...'}
                    </p>
                  </div>
                </div>
                {results.categoriesAPI.count > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {results.categoriesAPI.count} records
                  </span>
                )}
              </div>
            </div>

            {/* Comments API */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(results.commentsAPI.status)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Comments API (NEW)</h3>
                    <p className={`text-sm ${getStatusColor(results.commentsAPI.status)}`}>
                      {results.commentsAPI.message || 'Testing...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Likes API */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(results.likesAPI.status)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Likes API</h3>
                    <p className={`text-sm ${getStatusColor(results.likesAPI.status)}`}>
                      {results.likesAPI.message || 'Testing...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Retry Button */}
          <div className="mt-8 text-center">
            <button
              onClick={runTests}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              🔄 Retry Tests
            </button>
          </div>

          {/* System Info */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">System Configuration:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>Frontend: <span className="font-mono">http://localhost:3000</span></div>
              <div>Backend: <span className="font-mono">http://localhost:5000</span></div>
              <div>Database: <span className="font-mono">dictionnaire_ch</span></div>
              <div>API Base: <span className="font-mono">{apiService.baseURL}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
