import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Dog Parent",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
    content: "PawStay made finding care for Max so easy! The booking process was seamless, and the hotel staff sent daily updates. Highly recommend!",
    rating: 5,
    pet: "Golden Retriever",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Cat Parent",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
    content: "Finally, a platform that understands cat care! Luna had her own private suite with a view. The grooming service was exceptional.",
    rating: 5,
    pet: "Persian Cat",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Multi-Pet Parent",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop",
    content: "Booked for both my dog and rabbit. The facility handled them perfectly with separate areas. The vet check-up was a great add-on!",
    rating: 5,
    pet: "Beagle & Rabbit",
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Loved by Pet Parents
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See what thousands of happy pet parents are saying about their experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="relative bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow"
            >
              {/* Quote Icon */}
              <div className="absolute -top-3 -left-2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Quote className="h-5 w-5 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-rating text-rating" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} • {testimonial.pet}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
