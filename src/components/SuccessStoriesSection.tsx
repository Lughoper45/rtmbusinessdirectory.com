import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";

const SuccessStoriesSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      quote: "RTM Business Directory helped us secure $127K in grants we didn't even know we qualified for. The AI matching was incredibly accurate.",
      business: "Maple Tech Solutions",
      owner: "Sarah Chen",
      location: "Toronto, ON",
      highlight: "$127K in grants secured",
      rating: 5,
    },
    {
      quote: "As a new immigrant, finding local suppliers was challenging. RTM Directory connected us with verified businesses that understood our needs.",
      business: "Sunset Bakery",
      owner: "Ahmed Hassan",
      location: "Vancouver, BC",
      highlight: "50+ new supplier connections",
      rating: 5,
    },
    {
      quote: "The business dashboard transformed how we track compliance. No more missed deadlines, no more scrambling at the last minute.",
      business: "Northern Construction",
      owner: "Mike Thompson",
      location: "Calgary, AB",
      highlight: "100% compliance maintained",
      rating: 5,
    },
    {
      quote: "The AI coach answered questions I was too embarrassed to ask anyone else. It's like having a business mentor available 24/7.",
      business: "Green Leaf Designs",
      owner: "Priya Sharma",
      location: "Montreal, QC",
      highlight: "3x revenue growth",
      rating: 5,
    },
  ];

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 md:py-28 bg-surface-light">
      <div className="container mx-auto max-w-[1280px] px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-muted-foreground">
            See how businesses are growing with RTM Business Directory
          </p>
        </div>

        <div className="relative">
          {/* Navigation buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-background rounded-full shadow-medium flex items-center justify-center text-foreground hover:text-primary transition-colors hidden md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-background rounded-full shadow-medium flex items-center justify-center text-foreground hover:text-primary transition-colors hidden md:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Cards carousel */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 px-4 md:w-1/2 lg:w-1/3"
                >
                  <div className="bg-background rounded-2xl p-8 shadow-medium h-full">
                    <Quote className="w-10 h-10 text-primary/20 mb-4" />
                    <p className="text-foreground text-lg leading-relaxed mb-6">
                      "{testimonial.quote}"
                    </p>

                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                      ))}
                    </div>

                    {/* Business info */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                        {testimonial.business.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{testimonial.business}</p>
                        <p className="text-muted-foreground text-sm">{testimonial.owner}</p>
                        <p className="text-muted-foreground text-xs">{testimonial.location}</p>
                      </div>
                    </div>

                    {/* Highlight */}
                    <div className="inline-block bg-primary/10 text-primary font-bold text-sm px-4 py-2 rounded-lg">
                      {testimonial.highlight}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === activeIndex ? "bg-primary w-8" : "bg-border hover:bg-muted-foreground"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
