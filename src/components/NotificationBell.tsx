import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getNotificationLink = (type: string) => {
    switch (type) {
      case 'actualite':
        return '/actualites';
      case 'compte_rendu':
        return '/ag';
      case 'sondage':
        return '/sondages';
      case 'role_request':
        return '/admin/role-requests';
      default:
        return '/';
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    navigate(getNotificationLink(notification.type));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`cursor-pointer flex flex-col items-start p-3 gap-1 ${
                notification.read 
                  ? 'opacity-50 bg-muted/30' 
                  : 'bg-accent/10 border-l-2 border-accent'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-center gap-2 w-full">
                <span className={`font-medium text-sm flex-1 ${
                  notification.read ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                  {notification.title}
                </span>
                {!notification.read && (
                  <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
