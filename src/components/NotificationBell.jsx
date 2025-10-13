import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, CheckCheck } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Link } from 'react-router-dom';

// Notifications have been disabled globally. Render nothing.
const NotificationBell = () => null;

export default NotificationBell;