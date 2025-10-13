import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { UploadCloud, FileText, Trash2, Plus, Facebook, Instagram, Linkedin, Twitter, Youtube, Github, Link } from 'lucide-react';

const socialPlatforms = [
  { name: 'YouTube', icon: <Youtube className="h-5 w-5 text-red-600" /> },
  { name: 'GitHub', icon: <Github className="h-5 w-5" /> },
  { name: 'TikTok', icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-1.06-.6-1.92-1.44-2.56-2.48-1.87-2.99-1.28-6.61.93-9.12.51-.57 1.1-1.05 1.75-1.41.09-2.52.03-5.04.03-7.56C4.2 6.18 4.76 3.66 7.49 1.89 8.87.86 10.64.14 12.525.02zM15.11 6.88c-.85 0-1.7-.01-2.55-.01-."/></svg> },
  { name: 'Autre', icon: <Link className="h-5 w-5" /> }
];

const SocialIcon = ({ network }) => {
  switch (network.toLowerCase()) {
    case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
    case 'instagram': return <Instagram className="h-5 w-5 text-pink-500" />;
    case 'linkedin': return <Linkedin className="h-5 w-5 text-blue-700" />;
    case 'x': return <Twitter className="h-5 w-5" />;
    case 'youtube': return <Youtube className="h-5 w-5 text-red-600" />;
    case 'github': return <Github className="h-5 w-5" />;
    case 'tiktok': return <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-1.06-.6-1.92-1.44-2.56-2.48-1.87-2.99-1.28-6.61.93-9.12.51-.57 1.1-1.05 1.75-1.41.09-2.52.03-5.04.03-7.56C4.2 6.18 4.76 3.66 7.49 1.89 8.87.86 10.64.14 12.525.02zM15.11 6.88c-.85 0-1.7-.01-2.55-.01-."/></svg>;
    default: return <Link className="h-5 w-5" />;
  }
};

const Step3BAuthor = ({ formData, setFormData, onBack, onSubmit, loading }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files) => {
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        file: file, // Stocker le fichier réel
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setFormData({ ...formData, documents: [...formData.documents, ...newFiles] });
    }
  };

  const onDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFileChange(event.dataTransfer.files);
  }, [formData, setFormData]);

  const onDragOver = useCallback((event) => { event.preventDefault(); event.stopPropagation(); }, []);
  const onDragEnter = useCallback((event) => { event.preventDefault(); event.stopPropagation(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((event) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); }, []);

  const removeFile = (index) => {
    const newDocuments = [...formData.documents];
    newDocuments.splice(index, 1);
    setFormData({ ...formData, documents: newDocuments });
  };

  const handleSocialChange = (index, field, value) => {
    const newSocials = [...formData.socials];
    newSocials[index][field] = value;
    if (field === 'network' && value !== 'Autre') {
      newSocials[index].customNetwork = '';
    }
    setFormData({ ...formData, socials: newSocials });
  };

  const addSocialField = () => {
    setFormData({ ...formData, socials: [...formData.socials, { network: '', customNetwork: '', url: '' }] });
  };

  const removeSocialField = (index) => {
    const newSocials = [...formData.socials];
    newSocials.splice(index, 1);
    setFormData({ ...formData, socials: newSocials });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-center">Candidature Auteur</h2>
      <div className="space-y-4">
        <Label>Documents à fournir (CV, diplômes, etc.)</Label>
        <div
          onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragEnter} onDragLeave={onDragLeave}
          className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input id="dropzone-file" type="file" className="hidden" multiple onChange={(e) => handleFileChange(e.target.files)} />
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full cursor-pointer">
            <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez</p>
            <p className="text-xs text-gray-500">PDF, DOCX, etc.</p>
          </label>
        </div>
        {formData.documents.length > 0 && (
          <div className="space-y-2 mt-4">
            {formData.documents.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="biography">Biographie professionnelle</Label>
        <Textarea id="biography" rows={6} value={formData.biography} onChange={(e) => setFormData({ ...formData, biography: e.target.value })} placeholder="Présentez-vous, votre parcours, vos spécialités, vos motivations..." />
      </div>

      <div className="space-y-4">
        <Label>Réseaux sociaux</Label>
        {formData.socials.map((social, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              {index < 4 ? (
                <div className="flex-1 flex items-center gap-2 border rounded-md p-2">
                  <SocialIcon network={social.network} />
                  <Input className="border-none focus-visible:ring-0" placeholder={`URL du profil ${social.network}`} value={social.url} onChange={(e) => handleSocialChange(index, 'url', e.target.value)} />
                </div>
              ) : (
                <>
                  <div className="flex-1 flex items-center gap-2 border rounded-md p-2">
                    <Select value={social.network} onValueChange={(value) => handleSocialChange(index, 'network', value)}>
                      <SelectTrigger className="w-[150px] border-none focus:ring-0">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {socialPlatforms.map(platform => (
                          <SelectItem key={platform.name} value={platform.name}>
                            <div className="flex items-center gap-2">{platform.icon} {platform.name}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {social.network === 'Autre' && (
                       <Input className="border-none focus-visible:ring-0" placeholder="Nom du réseau" value={social.customNetwork} onChange={(e) => handleSocialChange(index, 'customNetwork', e.target.value)} />
                    )}

                    <Input className="border-none focus-visible:ring-0" placeholder="URL du profil" value={social.url} onChange={(e) => handleSocialChange(index, 'url', e.target.value)} />
                  </div>
                   <Button variant="ghost" size="icon" onClick={() => removeSocialField(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </>
              )}
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addSocialField}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un autre réseau
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>← Précédent</Button>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? 'Envoi en cours...' : 'Soumettre ma candidature'}
        </Button>
      </div>
    </div>
  );
};

export default Step3BAuthor;