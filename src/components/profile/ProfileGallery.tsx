import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Camera, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface ProfileGalleryProps {
  photos: string[];
}

const ProfileGallery = ({ photos }: ProfileGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const displayPhotos = photos.length > 0 ? photos : [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800"
  ];

  const nextPhoto = () => {
    setSelectedIndex((prev) => (prev + 1) % displayPhotos.length);
  };

  const prevPhoto = () => {
    setSelectedIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary" />
            </span>
            Gallery
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {displayPhotos.length} photos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {displayPhotos.slice(0, 4).map((photo, index) => (
            <Dialog key={index} open={isOpen && selectedIndex === index} onOpenChange={(open) => {
              setIsOpen(open);
              if (open) setSelectedIndex(index);
            }}>
              <DialogTrigger asChild>
                <button className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  {index === 3 && displayPhotos.length > 4 && (
                    <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">+{displayPhotos.length - 4}</span>
                    </div>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full p-0 bg-background/95 backdrop-blur-xl border-0">
                <div className="relative">
                  <img 
                    src={displayPhotos[selectedIndex]} 
                    alt={`Photo ${selectedIndex + 1}`}
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                  
                  {/* Navigation */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 px-4 py-2 rounded-full text-sm">
                    {selectedIndex + 1} / {displayPhotos.length}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {displayPhotos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedIndex === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img 
                        src={photo} 
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {displayPhotos.length > 4 && (
          <Button variant="outline" className="w-full mt-4">
            View All {displayPhotos.length} Photos
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileGallery;
