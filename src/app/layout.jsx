import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider } from '@/contexts/UIContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export const metadata = {
  title: 'SARRA CRM Portal',
  description: 'Government of Uttarakhand - Spring and River Rejuvenation Authority',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UIProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </UIProvider>
      </body>
    </html>
  );
}
