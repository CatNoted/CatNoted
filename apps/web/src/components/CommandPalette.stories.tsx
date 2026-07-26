import { CommandPalette } from './CommandPalette';
import type { ActiveMode } from '../layouts/AppLayout';

export default {
  title: 'Commands/CommandPalette',
  component: CommandPalette,
};

const baseProps = {
  onClose() {},
  onModeSelect: ((_mode: ActiveMode) => {}) as (_mode: ActiveMode) => void,
  onToggleTheme() {},
  onToggleZen() {},
  onOpenSettings() {},
  isDarkMode: false,
};

export const Open = () => <CommandPalette isOpen={true} {...baseProps} />;
