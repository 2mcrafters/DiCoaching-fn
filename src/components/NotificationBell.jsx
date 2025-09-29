import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, CheckCheck } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = () => {
        if (!user) return;
        const allNotifications = JSON.parse(localStorage.getItem('coaching_dict_notifications') || '[]');
        const userNotifications = allNotifications.filter(n => n.userId === user.id);
        setNotifications(userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setUnreadCount(userNotifications.filter(n => !n.read).length);
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 5000); // Poll for new notifications
        return () => clearInterval(interval);
    }, [user]);

    const markAllAsRead = () => {
        const allNotifications = JSON.parse(localStorage.getItem('coaching_dict_notifications') || '[]');
        const updatedNotifications = allNotifications.map(n => 
            n.userId === user.id ? { ...n, read: true } : n
        );
        localStorage.setItem('coaching_dict_notifications', JSON.stringify(updatedNotifications));
        loadNotifications();
    };
    
    if (!user) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                        <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                                <CheckCheck className="mr-2 h-4 w-4" />
                                Marquer lu
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-2 max-h-80 overflow-y-auto">
                       {notifications.length === 0 ? (
                           <div className="text-center p-8">
                               <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                               <p className="mt-4 text-sm text-muted-foreground">Vous n'avez aucune notification.</p>
                           </div>
                       ) : (
                           <div className="space-y-2">
                               {notifications.map(notif => (
                                   <div key={notif.id} className={`p-3 rounded-lg ${notif.read ? 'bg-transparent' : 'bg-primary/10'}`}>
                                       <p className="text-sm">{notif.content}</p>
                                       <p className="text-xs text-muted-foreground mt-1">
                                           {new Date(notif.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                       </p>
                                   </div>
                               ))}
                           </div>
                       )}
                    </CardContent>
                    <CardFooter className="p-2 border-t">
                        <Link to="/settings" className="w-full">
                           <Button variant="ghost" className="w-full">
                                Paramètres des notifications
                           </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;