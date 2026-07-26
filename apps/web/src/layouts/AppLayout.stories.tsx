import { AppLayout } from './AppLayout';

export default {
  title: 'Layout/AppLayout',
  component: AppLayout,
};

export const EmptyWorkspace = () => (
  <AppLayout activeMode="doc" onModeChange={() => {}} isDarkMode={false} onToggleTheme={() => {}}>
    <div />
  </AppLayout>
);
