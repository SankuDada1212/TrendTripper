import { useState } from "react";
import { Search, TrendingUp, Calendar, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-travel.jpg";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const features = [
    {
      icon: Compass,
      title: "Discover Monuments",
      description: "Upload images and identify historical landmarks instantly",
      link: "/discover",
      gradient: "gradient-hero",
    },
    {
      icon: TrendingUp,
      title: "Mood Recommender",
      description: "Get personalized recommendations based on your mood",
      link: "/mood",
      gradient: "gradient-sunset",
    },
    {
      icon: Calendar,
      title: "Events Near You",
      description: "Find exciting events and experiences in your area",
      link: "/events",
      gradient: "gradient-ocean",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-gradient">Explore the World</span>
            <br />
            <span className="text-foreground">Your Way</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            Discover monuments, plan trips, and create unforgettable memories
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto animate-scale-in">
            <div className="flex gap-2 bg-card/80 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-border/50">
              <Input
                type="text"
                placeholder="Search destinations, monuments, experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent text-lg focus-visible:ring-0"
              />
              <Button size="lg" className="gradient-hero text-white px-8">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link key={index} to={feature.link}>
              <Card className="card-hover card-glass h-full group cursor-pointer">
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-16 h-16 ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="gradient-hero text-white overflow-hidden">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Start Your Adventure?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Plan your perfect trip with our budget planner, find the best hotels, and book your travel all in one place.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/budget">
                <Button size="lg" variant="secondary" className="btn-scale">
                  Plan Budget
                </Button>
              </Link>
              <Link to="/hotels">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 btn-scale"
                >
                  Browse Hotels
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;
