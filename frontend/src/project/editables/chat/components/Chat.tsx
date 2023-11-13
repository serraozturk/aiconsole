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
import ScrollToBottom, { useScrollToBottom } from 'react-scroll-to-bottom';

import { EmptyChat } from '@/project/editables/chat/components/EmptyChat';
import { MessageGroup } from '@/project/editables/chat/components/MessageGroup';
import { useChatStore } from '@/project/editables/chat/store/useChatStore';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../../common/components/Button';
import { Analysis } from './Analysis';
import { useProjectsStore } from '@/projects/useProjectsStore';

export function ChatWindowScrollToBottomSave() {
  const scrollToBottom = useScrollToBottom();
  const setScrollChatToBottom = useChatStore((state) => state.setScrollChatToBottom);

  useEffect(() => {
    setScrollChatToBottom(scrollToBottom)
  }, [scrollToBottom, setScrollChatToBottom])

  return <></>
}

export function Chat({ chatId }: { chatId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, _] = useSearchParams();
  const copyId= searchParams.get('copy');
  const chat = useChatStore((state) => state.chat);
  const copyChat = useChatStore((state) => state.copyChat);
  const loadingMessages = useChatStore((state) => state.loadingMessages);
  const setChatId = useChatStore((state) => state.setChatId);
  const isAnalysisRunning = useChatStore((state) => !!state.currentAnalysisRequestId);
  const isExecuteRunning = useChatStore((state) => state.isExecuteRunning);
  const stopWork = useChatStore((state) => state.stopWork);
  const submitCommand = useChatStore((state) => state.submitCommand);
  const isProjectOpen = useProjectsStore((state) => state.isProjectOpen);
  const isProjectLoading = useProjectsStore((state) => state.isProjectLoading);

  const isLastMessageFromUser = chat.message_groups.length > 0 && chat.message_groups[chat.message_groups.length - 1].agent_id === 'user';
  
  useEffect(() => {
    setChatId(chatId);

    //if there is exactly one text area focus on it
    const textAreas = document.getElementsByTagName('textarea');
    if (textAreas.length === 1) {
      textAreas[0].focus();
    }

    return () => {
      stopWork();
      setChatId('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, isProjectOpen]); //Initentional trigger when chat_id changes


  useEffect(() => {
    if (copyId && chat.message_groups.length === 0) {
      copyChat(copyId, chatId);
    }
  }, [copyId, chatId, chat.message_groups.length, copyChat]);

  return !isProjectLoading && !loadingMessages ? ( // This is needed because of https://github.com/compulim/react-scroll-to-bottom/issues/61#issuecomment-1608456508
    <ScrollToBottom className="h-full overflow-y-auto flex flex-col" scrollViewClassName="main-chat-window" initialScrollBehavior="auto" mode={'bottom'}>
      <ChatWindowScrollToBottomSave />
      {chat.message_groups.length === 0 && <EmptyChat />}

      {chat.message_groups.map((group, index) => (
        <MessageGroup
          group={group}
          key={group.id}
          isStreaming={isExecuteRunning && index === chat.message_groups.length - 1}
        />
      ))}
      <Analysis />

      <div className="flex items-center justify-center m-5">
        {!isExecuteRunning && !isAnalysisRunning && !isLastMessageFromUser && <Button
          variant="secondary"

          onClick={() =>
            submitCommand(
              `I'm stuck at using AIConsole, can you suggest what can I do from this point in the conversation?`,
            )
          }
        >
          Guide me
        </Button>}
      </div>
    </ScrollToBottom>
  ) : (
    <div className="h-full overflow-y-auto flex flex-col"></div>
  );
}
