import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Artisans from "./pages/Artisans";
import Syndic from "./pages/Syndic";
import Actualites from "./pages/Actualites";
import ActualiteDetail from "./pages/ActualiteDetail";
import Sondages from "./pages/Sondages";
import AG from "./pages/AG";
import AdminArtisans from "./pages/admin/AdminArtisans";
import AdminSyndic from "./pages/admin/AdminSyndic";
import AdminActualites from "./pages/admin/AdminActualites";
import AdminSondages from "./pages/admin/AdminSondages";
import AdminAG from "./pages/admin/AdminAG";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/artisans" element={<ProtectedRoute><Artisans /></ProtectedRoute>} />
                <Route path="/syndic" element={<ProtectedRoute><Syndic /></ProtectedRoute>} />
                <Route path="/actualites" element={<ProtectedRoute><Actualites /></ProtectedRoute>} />
                <Route path="/actualites/:id" element={<ProtectedRoute><ActualiteDetail /></ProtectedRoute>} />
                <Route path="/ag" element={<ProtectedRoute><AG /></ProtectedRoute>} />
                <Route path="/sondages" element={<ProtectedRoute><Sondages /></ProtectedRoute>} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/admin/artisans" element={<ProtectedRoute requireAG><AdminArtisans /></ProtectedRoute>} />
                <Route path="/admin/syndic" element={<ProtectedRoute requireAG><AdminSyndic /></ProtectedRoute>} />
                <Route path="/admin/actualites" element={<ProtectedRoute requireAG><AdminActualites /></ProtectedRoute>} />
                <Route path="/admin/ag" element={<ProtectedRoute requireAG><AdminAG /></ProtectedRoute>} />
                <Route path="/admin/sondages" element={<ProtectedRoute requireAG><AdminSondages /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
