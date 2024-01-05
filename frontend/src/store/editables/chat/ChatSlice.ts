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

import { StateCreator } from 'zustand';

import { Chat } from '@/types/editables/chatTypes';
import { ChatStore } from './useChatStore';
import { useEditablesStore } from '../useEditablesStore';
import { EditablesAPI } from '@/api/api/EditablesAPI';

export type ChatSlice = {
  chat?: Chat;
  lastUsedChat?: Chat;
  setLastUsedChat: (chat: Chat) => void;
  setChat: (chat: Chat) => void;
  renameChat: (newChat: Chat) => Promise<void>;
};

export const createChatSlice: StateCreator<ChatStore, [], [], ChatSlice> = (set, get) => ({
  chat: undefined,
  agent: undefined,
  lastUsedChat: undefined,
  materials: [],
  setLastUsedChat: (chat: Chat) => {
    set({ lastUsedChat: chat });
  },
  setChat: (chat: Chat) => {
    set({ chat });
  },
  renameChat: async (newChat: Chat) => {
    await EditablesAPI.updateEditableObject('chat', newChat, newChat.id);
    get().setChat(newChat);

    //If it's chat we need to reload chat history because there is no autoreload on change for chats
    useEditablesStore.getState().initChatHistory();
  },
});
