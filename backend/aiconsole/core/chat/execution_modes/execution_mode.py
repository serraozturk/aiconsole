from typing import Protocol

from pydantic import BaseModel

from aiconsole.core.assets.agents.agent import AICAgent
from aiconsole.core.assets.materials.material import Material
from aiconsole.core.assets.materials.rendered_material import RenderedMaterial
from aiconsole.core.chat.chat_mutator import ChatMutator


class ProcessChatDataProtocol(Protocol):
    async def __call__(
        self,
        chat_mutator: ChatMutator,
        agent: AICAgent,
        materials: list[Material],
        rendered_materials: list[RenderedMaterial],
    ) -> None:  # fmt: off
        ...


class AcceptCodeDataProtocol(Protocol):
    async def __call__(
        self,
        chat_mutator: ChatMutator,
        tool_call_id: str,
        agent: AICAgent,
        materials: list[Material],
        rendered_materials: list[RenderedMaterial],
    ) -> None:  # fmt: off
        ...


class FetchDataProtocol(Protocol):
    async def __call__(self, command: str, output_format: str) -> None:  # fmt: off
        ...


def process_chat_not_supported(
    chat_mutator: ChatMutator,
    agent: AICAgent,
    materials: list[Material],
    rendered_materials: list[RenderedMaterial],
):
    raise NotImplementedError("process chat is not supported")


def accept_code_not_supported(
    chat_mutator: ChatMutator,
    tool_call_id: str,
    agent: AICAgent,
    materials: list[Material],
    rendered_materials: list[RenderedMaterial],
):
    raise NotImplementedError("accept code is not supported")


class ExecutionMode(BaseModel):
    process_chat: ProcessChatDataProtocol = process_chat_not_supported
    accept_code: AcceptCodeDataProtocol = accept_code_not_supported
