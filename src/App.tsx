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
import BadgesVigik from "./pages/BadgesVigik";
import Syndic from "./pages/Syndic";
import Actualites from "./pages/Actualites";
import ActualiteDetail from "./pages/ActualiteDetail";
import Sondages from "./pages/Sondages";
import AG from "./pages/AG";
import AdminBadgesVigik from "./pages/admin/AdminBadgesVigik";
import AdminSyndic from "./pages/admin/AdminSyndic";
import AdminActualites from "./pages/admin/AdminActualites";
import AdminSondages from "./pages/admin/AdminSondages";
import AdminAG from "./pages/admin/AdminAG";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { Analytics } from "@vercel/analytics/react";
import { CookieConsentProvider, useCookieConsent } from "@/contexts/CookieConsentContext";
import CookieBanner from "@/components/CookieBanner";
import MentionsLegales from "./pages/MentionsLegales";
import Confidentialite from "./pages/Confidentialite";
import Cookies from "./pages/Cookies";

const queryClient = new QueryClient();

function AnalyticsIfConsented() {
  const { consent } = useCookieConsent();
  if (!consent.analytics) return null;
  return <Analytics />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CookieConsentProvider>
            <div className="flex flex-col min-h-screen">
              <Navigation />
              <main className="flex-1">
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/badges-vigik" element={<ProtectedRoute><BadgesVigik /></ProtectedRoute>} />
                <Route path="/syndic" element={<ProtectedRoute><Syndic /></ProtectedRoute>} />
                <Route path="/actualites" element={<ProtectedRoute><Actualites /></ProtectedRoute>} />
                <Route path="/actualites/:id" element={<ProtectedRoute><ActualiteDetail /></ProtectedRoute>} />
                <Route path="/ag" element={<ProtectedRoute><AG /></ProtectedRoute>} />
                <Route path="/sondages" element={<ProtectedRoute><Sondages /></ProtectedRoute>} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/admin/badges-vigik" element={<ProtectedRoute requireAG><AdminBadgesVigik /></ProtectedRoute>} />
                <Route path="/admin/syndic" element={<ProtectedRoute requireAG><AdminSyndic /></ProtectedRoute>} />
                <Route path="/admin/actualites" element={<ProtectedRoute requireAG><AdminActualites /></ProtectedRoute>} />
                <Route path="/admin/ag" element={<ProtectedRoute requireAG><AdminAG /></ProtectedRoute>} />
                <Route path="/admin/sondages" element={<ProtectedRoute requireAG><AdminSondages /></ProtectedRoute>} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="/confidentialite" element={<Confidentialite />} />
                <Route path="/cookies" element={<Cookies />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <CookieBanner />
              <AnalyticsIfConsented />
            </div>
          </CookieConsentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
