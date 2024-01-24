// The AIConsole Project
//
// Copyright 2023 10Clouds
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Content, Portal, Root } from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TopGradient from '@/components/common/TopGradient';
import { useSettingsStore } from '@/store/settings/useSettingsStore';
import { Button } from '../../common/Button';
import { Icon } from '../../common/icons/Icon';
import GlobalSettingsApiSection from './sections/GlobalSettingsApiSection';
import GlobalSettingsCodeSection from './sections/GlobalSettingsCodeSection';
import GlobalSettingsUserSection from './sections/GlobalSettingsUserSection';
import { GlobalSettingsFormData, GlobalSettingsFormSchema } from '@/forms/globalSettingsForm';

// TODO: implement other features from figma like api for azure, user profile and tutorial
export const GlobalSettingsModal = () => {
  const isSettingsModalVisible = useSettingsStore((state) => state.isSettingsModalVisible);
  const setSettingsModalVisibility = useSettingsStore((state) => state.setSettingsModalVisibility);

  const username = useSettingsStore((state) => state.username);
  const email = useSettingsStore((state) => state.userEmail);
  const userAvatarUrl = useSettingsStore((state) => state.userAvatarUrl);
  const openAiApiKey = useSettingsStore((state) => state.openAiApiKey);
  const alwaysExecuteCode = useSettingsStore((state) => state.alwaysExecuteCode);
  const saveSettings = useSettingsStore((state) => state.saveSettings);

  const { reset, control, setValue, formState, handleSubmit, getFieldState } = useForm<GlobalSettingsFormData>({
    resolver: zodResolver(GlobalSettingsFormSchema),
  });

  useEffect(() => {
    // Initial form values are cached, so we need to reset with the right ones
    if (isSettingsModalVisible) {
      reset({
        user_profile: {
          username,
          email: email || '',
        },
        openai_api_key: openAiApiKey,
        avatarUrl: userAvatarUrl,
        code_autorun: alwaysExecuteCode,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsModalVisible]);

  const onSubmit = (data: GlobalSettingsFormData) => {
    if (!Object.keys(formState.dirtyFields).length) {
      setSettingsModalVisibility(false);
      return;
    }

    let avatarFormData: FormData | null = null;

    const isProfileDirty = getFieldState('user_profile').isDirty;
    const isApiKeyDirty = getFieldState('openai_api_key').isDirty;
    const isAutorunDirty = getFieldState('code_autorun').isDirty;
    const isAvatarDirty = getFieldState('avatar').isDirty;

    console.log(isAvatarDirty, data.avatar);

    if (isAvatarDirty && data.avatar) {
      avatarFormData = new FormData();
      avatarFormData.append('avatar', data.avatar);
    }

    saveSettings(
      {
        ...(isProfileDirty ? { user_profile: data.user_profile } : {}),
        ...(isApiKeyDirty ? { openai_api_key: data.openai_api_key } : {}),
        ...(isAutorunDirty ? { code_autorun: data.code_autorun } : {}),
      },
      true,
      avatarFormData,
    );

    setSettingsModalVisibility(false);
  };

  const handleSetAvatarImage = (avatar: File) => setValue('avatar', avatar, { shouldDirty: true });

  const handleSetAutorun = (autorun: boolean) => setValue('code_autorun', autorun, { shouldDirty: true });

  const handleModalClose = () => {
    if (formState.isDirty) {
      console.log('form dirty! discard changes modal');
    }
    setSettingsModalVisibility(false);
  };

  return (
    <Root open={isSettingsModalVisible}>
      <Portal>
        <Content asChild className="fixed" onEscapeKeyDown={handleModalClose}>
          <div className="w-full h-[100vh] z-[98] top-0 left-0 right-0 bg-gray-900">
            <TopGradient />
            <div className="flex justify-between items-center px-[30px] py-[26px] relative z-10">
              <img src={`favicon.svg`} className="h-[48px] w-[48px] cursor-pointer filter" />
              <h3 className="text-gray-400 text-[14px] leading-[21px]">AIConsole settings</h3>
              <Button variant="secondary" onClick={handleModalClose} small>
                <Icon icon={X} />
                Close
              </Button>
            </div>
            <div className="h-[calc(100%-100px)] max-w-[720px] mx-auto relative flex flex-col justify-center gap-5">
              <form onSubmit={handleSubmit(onSubmit)}>
                <GlobalSettingsUserSection
                  control={control}
                  avatarUrl={userAvatarUrl}
                  onImageSelected={handleSetAvatarImage}
                />
                <GlobalSettingsApiSection control={control} />
                <GlobalSettingsCodeSection control={control} onChange={handleSetAutorun} />
                <div className="flex items-center justify-end gap-[10px] mt-[60px]">
                  <Button variant="secondary" bold onClick={handleModalClose}>
                    Cancel
                  </Button>
                  <Button type="submit">{'Save'}</Button>
                </div>
              </form>
            </div>
          </div>
        </Content>
      </Portal>
    </Root>
  );
};
