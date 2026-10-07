import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider } from '@/contexts/UIContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export const metadata = {
  title: 'SARRA CRM Portal',
  description: 'Government of Uttarakhand - Spring and River Rejuvenation Authority',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <UIProvider>
            <AuthProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AuthProvider>
          </UIProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
