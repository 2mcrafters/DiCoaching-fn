import React from 'react';
import ApiStatus from '../components/ApiStatus';
import TermsList from '../components/TermsList';

const ApiTest = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Test de l'API Backend
          </h1>
          <p className="text-gray-600">
            Vérification de la connexion entre le frontend et le backend
          </p>
        </div>

        {/* Statut de l'API */}
        <ApiStatus />

        {/* Liste des termes */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Termes du Dictionnaire
            </h2>
            <p className="text-gray-600 mb-6">
              Liste des termes récupérés depuis l'API backend avec possibilité de recherche et filtrage.
            </p>
            
            <TermsList />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            Instructions de test
          </h3>
          
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <strong>1. Backend démarré :</strong> Assurez-vous que le serveur backend est en cours d'exécution sur le port 5000
            </p>
            <p>
              <strong>2. Commande :</strong> <code className="bg-blue-100 px-2 py-1 rounded">npm run backend:mock</code>
            </p>
            <p>
              <strong>3. Test API :</strong> Vous pouvez tester directement l'API sur{' '}
              <a 
                href="http://localhost:5050/api/test-db" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-900"
              >
                http://localhost:5050/api/test-db
              </a>
            </p>
            <p>
              <strong>4. Endpoints disponibles :</strong>
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li><code>/api/terms</code> - Liste des termes</li>
              <li><code>/api/terms/:id</code> - Terme spécifique</li>
              <li><code>/api/categories</code> - Liste des catégories</li>
              <li><code>/api/stats</code> - Statistiques</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;