import React from 'react';
import { SettingsModal } from './SettingsModal';

export default {
  title: 'Settings/SettingsModal',
  component: SettingsModal,
};

export const Default = () => <SettingsModal isOpen={false} onClose={() => {}} passphrase="" onPassphraseChange={() => {}} />;
