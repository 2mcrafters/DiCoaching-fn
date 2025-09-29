import React from 'react';
import { Shield, Star, Gem, Crown } from 'lucide-react';

export const getAuthorBadge = (score) => {
  if (score >= 100) {
    return { 
      name: 'Expert', 
      icon: <Crown className="h-3 w-3" />, 
      variant: 'destructive',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    };
  }
  if (score >= 50) {
    return { 
      name: 'Or', 
      icon: <Gem className="h-3 w-3" />, 
      variant: 'default',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    };
  }
  if (score >= 20) {
    return { 
      name: 'Argent', 
      icon: <Star className="h-3 w-3" />, 
      variant: 'secondary',
      bgColor: 'bg-gray-200',
      textColor: 'text-gray-800'
    };
  }
  return { 
    name: 'Bronze', 
    icon: <Shield className="h-3 w-3" />, 
    variant: 'outline',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800'
  };
};