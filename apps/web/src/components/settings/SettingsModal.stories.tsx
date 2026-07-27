import { SettingsModal } from './SettingsModal';

export default {
  title: 'Settings/SettingsModal',
  component: SettingsModal,
};

export const Default = () => <SettingsModal isOpen={true} onClose={() => {}} passphrase="" onPassphraseChange={() => {}} />;
