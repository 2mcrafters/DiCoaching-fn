import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Share2, Copy, Check, MessageCircle, Facebook, Linkedin } from 'lucide-react';

const SharePopover = ({ url, title, children }) => {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: 'Lien copié !',
      description: 'Le lien a été copié dans votre presse-papiers.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const socialShares = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-5 w-5" />,
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      className: 'bg-green-500 hover:bg-green-600 text-white'
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="h-5 w-5" />,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      className: 'bg-sky-700 hover:bg-sky-800 text-white'
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Partager</h4>
            <p className="text-sm text-muted-foreground">
              Partagez ce terme avec d'autres.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link">Lien direct</Label>
            <div className="flex items-center space-x-2">
              <Input id="link" value={url} readOnly className="h-9" />
              <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                <span className="sr-only">Copier</span>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {socialShares.map(social => (
              <Button
                key={social.name}
                asChild
                variant="outline"
                size="sm"
                className={social.className}
              >
                <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`Partager sur ${social.name}`}>
                  {social.icon}
                </a>
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SharePopover;