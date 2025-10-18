import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

const PhotoCarousel = () => {
  const [emblaRef] = useEmblaCarousel({ loop: true });

  const photos = [
    {
      id: 1,
      alt: "Personnes en réunion de coaching",
      description: "Séance de coaching en équipe",
    },
    {
      id: 2,
      alt: "Coach écrivant sur un tableau blanc",
      description: "Planification stratégique",
    },
    {
      id: 3,
      alt: "Deux personnes en conversation",
      description: "Coaching individuel",
    },
    {
      id: 4,
      alt: "Groupe de personnes souriantes",
      description: "Succès d'équipe",
    },
    {
      id: 5,
      alt: "Personne réfléchissant devant un ordinateur",
      description: "Développement personnel",
    },
  ];

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            className="flex-shrink-0 flex-grow-0 basis-full min-w-0 pl-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    className="object-cover w-full h-full"
                    alt={photo.alt}
                    src="images/rachid.jpg"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PhotoCarousel;