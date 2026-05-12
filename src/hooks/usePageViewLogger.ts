import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logAudit } from '@/lib/auditLog';

const IGNORED_PREFIXES = ['/auth', '/reset-password', '/cookies', '/mentions-legales', '/confidentialite'];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Accueil',
  '/vitrine': 'Vitrine',
  '/contact': 'Contactez-nous',
  '/actualites': 'Actualités',
  '/sondages': 'Consultations',
  '/ag': 'AG',
  '/conseil-syndical': 'Conseil Syndical',
  '/syndic': 'Syndic',
  '/badges-vigik': 'Badges Vigik',
  '/membres': 'Membres',
  '/profile': 'Profil',
  '/dashboard': 'Tableau de bord',
  '/admin/board': 'Admin Board',
  '/admin/board/members': 'Admin · Membres',
  '/admin/board/logs': 'Admin · Journal',
  '/admin/board/password': 'Admin · Mots de passe',
  '/admin/actualites': 'Admin · Actualités',
  '/admin/sondages': 'Admin · Consultations',
  '/admin/ag': 'Admin · AG',
  '/admin/conseil-syndical': 'Admin · Conseil Syndical',
  '/admin/syndic': 'Admin · Syndic',
  '/admin/badges-vigik': 'Admin · Badges Vigik',
  '/admin/vitrine': 'Admin · Vitrine',
};

export const usePageViewLogger = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const lastLogged = useRef<string>('');

  useEffect(() => {
    if (isLoading || !user) return;
    const path = location.pathname;
    if (IGNORED_PREFIXES.some(p => path === p || path.startsWith(p + '/'))) return;
    if (lastLogged.current === path) return;

    const timer = setTimeout(() => {
      lastLogged.current = path;
      // Find best matching title (exact or prefix for dynamic routes like /actualites/:id)
      let title = PAGE_TITLES[path];
      if (!title) {
        const base = '/' + path.split('/')[1];
        title = PAGE_TITLES[base] || path;
      }
      logAudit({ action: 'page_view', page: path, details: { page_title: title } });
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname, user, isLoading]);
};
