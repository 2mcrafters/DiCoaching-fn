import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Save } from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notificationSettings, setNotificationSettings] = useState({
        newTermApproved: true,
        modificationApproved: true,
        commentOnMyTerm: true,
        reportStatusUpdate: true,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const storedSettings = JSON.parse(localStorage.getItem(`notification_settings_${user.id}`));
            if (storedSettings) {
                setNotificationSettings(storedSettings);
            }
        }
        setLoading(false);
    }, [user]);

    const handleSettingChange = (key) => {
        setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveSettings = () => {
        if (user) {
            localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(notificationSettings));
            toast({
                title: "Paramètres sauvegardés",
                description: "Vos préférences de notification ont été mises à jour.",
            });
        }
    };
    
    if (loading) {
        return <div>Chargement...</div>;
    }

    return (
        <>
            <Helmet>
                <title>Paramètres - Dictionnaire du Coaching</title>
                <meta name="description" content="Gérez vos paramètres de compte et de notifications." />
            </Helmet>
            <div className="min-h-screen creative-bg">
                <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-3xl font-bold text-foreground mb-8">Paramètres</h1>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-6 w-6" />
                                    Paramètres de Notifications
                                </CardTitle>
                                <CardDescription>
                                    Choisissez les notifications que vous souhaitez recevoir.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {Object.entries(notificationSettings).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                                        <Label htmlFor={key} className="text-base">
                                            { {
                                                newTermApproved: "Approbation d'un nouveau terme",
                                                modificationApproved: "Approbation d'une modification",
                                                commentOnMyTerm: "Nouveau commentaire sur mes termes",
                                                reportStatusUpdate: "Mise à jour sur un signalement"
                                            }[key] }
                                        </Label>
                                        <Switch
                                            id={key}
                                            checked={value}
                                            onCheckedChange={() => handleSettingChange(key)}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="mt-8 flex justify-end">
                            <Button onClick={handleSaveSettings}>
                                <Save className="mr-2 h-4 w-4" />
                                Sauvegarder les paramètres
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default Settings;
