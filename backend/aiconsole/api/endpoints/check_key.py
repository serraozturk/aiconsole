# The AIConsole Project
#
# Copyright 2023 10Clouds
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from aiconsole.core.gpt.check_key import check_key

router = APIRouter()


class KeyVerificationRequest(BaseModel):
    key: str


class KeyResponse(BaseModel):
    key: str | None


@router.get("/api/key", response_model=KeyResponse)
async def get_key(key: str) -> KeyResponse:
    is_key_ok = await check_key(key)
    return KeyResponse(key=key if is_key_ok else None)
