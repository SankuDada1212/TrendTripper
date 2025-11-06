import { useState } from "react";
import { Search, TrendingUp, Calendar, Compass, UtensilsCrossed, Hotel, Wallet, Star, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    {
      icon: UtensilsCrossed,
      title: "Discover Restaurants",
      description: "Find the perfect dining experience based on your mood",
      link: "/restaurants",
      gradient: "gradient-sunset",
    },
    {
      icon: Hotel,
      title: "Book Hotels",
      description: "Find and book the best hotels for your stay",
      link: "/hotels",
      gradient: "gradient-ocean",
    },
    {
      icon: Wallet,
      title: "Budget Planner",
      description: "Plan your trip expenses and manage your budget",
      link: "/budget",
      gradient: "gradient-hero",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Explore",
      description: "Discover monuments, restaurants, events, and hotels tailored to your preferences",
    },
    {
      step: "2",
      title: "Plan",
      description: "Use our budget planner to organize your trip expenses and activities",
    },
    {
      step: "3",
      title: "Book",
      description: "Reserve hotels, restaurants, and events all in one place",
    },
    {
      step: "4",
      title: "Enjoy",
      description: "Experience amazing adventures and create unforgettable memories",
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
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Our Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to plan and enjoy your perfect trip
          </p>
        </div>
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

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plan your perfect trip in just a few simple steps
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {howItWorks.map((item, index) => (
            <Card key={index} className="card-glass text-center relative">
              <CardContent className="p-6">
                <div className="w-16 h-16 gradient-hero rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </CardContent>
              {index < howItWorks.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-hero transform translate-x-full" />
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Why Choose Trend Tripper?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the difference with our comprehensive travel platform
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="card-glass">
            <CardContent className="p-6">
              <div className="w-12 h-12 gradient-hero rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Get instant results for monument identification, restaurant searches, and more
              </p>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="p-6">
              <div className="w-12 h-12 gradient-sunset rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure & Reliable</h3>
              <p className="text-muted-foreground">
                Your data is safe with us. We use industry-standard encryption and security measures
              </p>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="p-6">
              <div className="w-12 h-12 gradient-ocean rounded-xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Personalized Experience</h3>
              <p className="text-muted-foreground">
                Get recommendations tailored to your mood, preferences, and travel style
              </p>
            </CardContent>
          </Card>
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
              Plan your perfect trip with our budget planner, find the best hotels, discover restaurants, and book your travel all in one place.
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
              <Link to="/restaurants">
                <Button
                  size="lg"
                  variant="secondary"
                  className="btn-scale"
                >
                  Find Restaurants
                </Button>
              </Link>
              <Link to="/events">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 btn-scale"
                >
                  Explore Events
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
