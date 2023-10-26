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

import { Api } from '@/api/Api';
import { AICStore } from './AICStore';
import { useAnalysisStore } from './useAnalysisStore';
import { getGroup, getMessage } from './MessageSlice';

export type ActionSlice = {
  doExecute: () => Promise<void>;
  doRun: () => Promise<void>;
  isExecuteRunning: boolean;
  isWorking: () => boolean;
  stopWork: () => void;
  executeAbortSignal: AbortController;
};

export const createActionSlice: StateCreator<AICStore, [], [], ActionSlice> = (
  set,
  get,
) => ({
  isExecuteRunning: false,

  executeAbortSignal: new AbortController(),

  doRun: async () => {
    set(() => ({
      executeAbortSignal: new AbortController(),
      isExecuteRunning: true,
    }));

    const lastMessageLocation = getMessage(get().chat);
    const lastMessage = lastMessageLocation.message;

    if (!('language' in lastMessage)) {
      throw new Error('Last message is not a code message');
    }

    const language = lastMessage.language;
    const code = lastMessage.content;
    const agentId = lastMessageLocation.group.agent_id;
    const task = lastMessageLocation.group.task;
    const materials_ids = lastMessageLocation.group.materials_ids;

    try {
      const response = await Api.runCode({
        chatId: get().chatId,
        language,
        code,
        materials_ids,
        signal: get().executeAbortSignal.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      get().appendEmptyOutput()

      while (true) {
        try {
          const { value, done } = (await reader?.read()) || {
            value: undefined,
            done: true,
          };

          const textChunk = decoder.decode(value);

          get().appendTextAtTheEnd(textChunk)

          if (done) {
            break;
          }
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            console.log('Execution operation aborted');
            return;
          } else {
            throw err;
          }
        }
      }
    } finally {
      get().saveCurrentChatHistory();

      set(() => ({
        isExecuteRunning: false,
      }));
    }


    // We ran code, continue operation with the same agent
    console.log('from run output: doExecute');

    //Create new message with the same agent, needed for doExecute

    get().appendGroup({
      agent_id: agentId,
      task: task,
      materials_ids,
      role: 'assistant',
      messages: [],
    })

    await get().doExecute();
  },

  /**
   * doExecute expects that the last message is the one it should be filling in.
   */
  doExecute: async () => {

    set(() => ({
      executeAbortSignal: new AbortController(),
      isExecuteRunning: true,
    }));

    try {
      const lastGroup = getGroup(get().chat).group;

      const response = await Api.execute(
        {
          ...get().chat,
          relevant_materials_ids: lastGroup.materials_ids,
          agent_id: lastGroup.agent_id,
        },
        get().executeAbortSignal.signal,
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      let messageDone = true;

      while (true) {
        try {
          const { value, done } = (await reader?.read()) || {
            value: undefined,
            done: true,
          };

          const TOKEN_PROCESSORS = [
            ...['python', 'shell', 'applescript'].map((language) => ({
              token: `<<<< START CODE (${language}) >>>>`,
              processor: () => {
                get().appendMessage({
                  content: '',
                  language,
                  outputs: [],
                });
                messageDone = false;
              },
            })),
            {
              token: '<<<< END CODE >>>>',
              processor: () => {
                if (messageDone) throw new Error('Invalid chunk');
                messageDone = true;
              },
            },
            {
              token: '<<<< CLEAR >>>>',
              processor: () => {
                get().removeMessageFromGroup();
                messageDone = true;
              }
            },
          ];

          const textChunk = decoder.decode(value);

          const escapeRegExp = (string: string) =>
            string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const tokens = TOKEN_PROCESSORS.map((processor) => processor.token);
          const regexPattern = new RegExp(
            `(${tokens.map(escapeRegExp).join('|')})`,
            'g',
          );
          const splitText = textChunk
            .split(regexPattern)
            .filter((text) => text !== '');

          for (const text of splitText) {
            let consumed = false;
            TOKEN_PROCESSORS.forEach((tokenProcessor) => {
              if (text === tokenProcessor.token) {
                tokenProcessor.processor();
                consumed = true;
              }
            });

            if (!consumed) {
              if (messageDone) {
                //new plain message
                get().appendMessage({
                  content: '',
                });
                messageDone = false;
              }
              get().appendTextAtTheEnd(text);
            }
          }

          if (done) {
            break;
          }
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            console.log('Execution operation aborted');
            return;
          } else {
            throw err;
          }
        }
      }
    } finally {
      //If the message is still empty, remove it

      if (getMessage(get().chat).message.content === '') {
        get().removeMessageFromGroup();
      }

      get().saveCurrentChatHistory();

      set(() => ({
        isExecuteRunning: false,
      }));
    }

    {
      const lastMessage = getMessage(get().chat).message;
      const isCode = 'language' in lastMessage;

      if (isCode) {
        if (get().alwaysExecuteCode) {
          await get().doRun();
        }
      } else {
        useAnalysisStore.getState().doAnalysis();
      }
    }
  },

  isWorking: () =>
    useAnalysisStore.getState().isAnalysisRunning || get().isExecuteRunning,
  stopWork: () => {
    get().executeAbortSignal.abort();
    useAnalysisStore.getState().analysisAbortController.abort();
  },
});
