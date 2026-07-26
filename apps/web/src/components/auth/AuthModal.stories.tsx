import { AuthModal } from './AuthModal';

export default {
  title: 'Auth/AuthModal',
  component: AuthModal,
};

export const GuestMode = () => (
  <AuthModal isOpen={false} onClose={() => {}} onAuthSuccess={() => {}} userEmail="guest@catnoted.com" />
);

export const LoggedIn = () => (
  <AuthModal isOpen={false} onClose={() => {}} onAuthSuccess={() => {}} userEmail="aldani@catnoted.com" />
);
