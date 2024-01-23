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

import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { TextInput } from '@/components/editables/assets/TextInput';
import { GlobalSettingsFormData } from '@/forms/globalSettingsForm';

interface GlobalSectionApiSectionProps {
  control: Control<GlobalSettingsFormData>;
}

const GlobalSettingsApiSection = ({ control }: GlobalSectionApiSectionProps) => {
  return (
    <div className="border border-gray-600 rounded-xl p-[20px]">
      <Controller
        control={control}
        name="openai_api_key"
        render={({ field }) => (
          <TextInput {...field} horizontal placeholder="OpenAI API key..." label="API" name="api" />
        )}
      />
    </div>
  );
};
export default GlobalSettingsApiSection;
