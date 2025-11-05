import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SOSButton from "./components/SOSButton";
import { PasswordGate } from "./components/PasswordGate";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Mood from "./pages/Mood";
import Events from "./pages/Events";
import Budget from "./pages/Budget";
import Hotels from "./pages/Hotels";
// import Travel from "./pages/Travel";
import NotFound from "./pages/NotFound";
import MonumentSearch from "@/pages/MonumentSearch"; // ✅ keep only this import
import Bookings from "@/pages/Bookings";
import Restaurants from "@/pages/Restaurants";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PasswordGate>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/mood" element={<Mood />} />
                <Route path="/events" element={<Events />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/hotels" element={<Hotels />} />
                {/* <Route path="/travel" element={<Travel />} /> */}
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/monument-search" element={<MonumentSearch />} /> {/* ✅ added here */}
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <SOSButton />
          </div>
        </BrowserRouter>
      </PasswordGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
