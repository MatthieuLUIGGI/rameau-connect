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
import Assemblee from "./pages/Assemblee";
import Actualites from "./pages/Actualites";
import Sondages from "./pages/Sondages";
import AdminArtisans from "./pages/admin/AdminArtisans";
import AdminAssemblee from "./pages/admin/AdminAssemblee";
import AdminActualites from "./pages/admin/AdminActualites";
import AdminSondages from "./pages/admin/AdminSondages";
import Contact from "./pages/Contact";
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
                <Route path="/assemblee" element={<ProtectedRoute><Assemblee /></ProtectedRoute>} />
                <Route path="/actualites" element={<ProtectedRoute><Actualites /></ProtectedRoute>} />
                <Route path="/sondages" element={<ProtectedRoute><Sondages /></ProtectedRoute>} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin/artisans" element={<ProtectedRoute requireAG><AdminArtisans /></ProtectedRoute>} />
                <Route path="/admin/assemblee" element={<ProtectedRoute requireAG><AdminAssemblee /></ProtectedRoute>} />
                <Route path="/admin/actualites" element={<ProtectedRoute requireAG><AdminActualites /></ProtectedRoute>} />
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
