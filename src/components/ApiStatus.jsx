import React from 'react';
import { useApiConnection, useStats } from '../hooks/useApi';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

const ApiStatus = () => {
  const { isConnected, isLoading: connectionLoading, error: connectionError } = useApiConnection();
  const { stats, isLoading: statsLoading, error: statsError } = useStats();

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">État du Backend</h3>
        <Badge 
          variant={isConnected ? "default" : "destructive"}
          className={isConnected ? "bg-green-500" : "bg-red-500"}
        >
          {connectionLoading ? "Connexion..." : isConnected ? "Connecté" : "Déconnecté"}
        </Badge>
      </div>

      {connectionError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-700 text-sm">
            <strong>Erreur de connexion:</strong> {connectionError}
          </p>
          <p className="text-red-600 text-xs mt-1">
            Assurez-vous que le serveur backend est démarré sur le port 5000
          </p>
        </div>
      )}

      {isConnected && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? "..." : stats?.totalTerms || 0}
            </div>
            <div className="text-sm text-gray-600">Termes</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? "..." : stats?.totalUsers || 0}
            </div>
            <div className="text-sm text-gray-600">Utilisateurs</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statsLoading ? "..." : stats?.totalCategories || 0}
            </div>
            <div className="text-sm text-gray-600">Catégories</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {statsLoading ? "..." : stats?.approvedTerms || 0}
            </div>
            <div className="text-sm text-gray-600">Approuvés</div>
          </div>
        </div>
      )}

      {statsError && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <p className="text-yellow-700 text-sm">
            <strong>Erreur des statistiques:</strong> {statsError}
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        URL API: http://localhost:5000 | Mode: Données mockées
      </div>
    </Card>
  );
};

export default ApiStatus;