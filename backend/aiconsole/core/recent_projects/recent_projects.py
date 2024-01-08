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

import os
from pathlib import Path

from appdirs import user_config_dir

from aiconsole.consts import MAX_RECENT_PROJECTS
from aiconsole.core.chat.list_possible_historic_chat_ids import (
    list_possible_historic_chat_ids,
)
from aiconsole.core.chat.load_chat_history import load_chat_history
from aiconsole.core.recent_projects.recent_project import (
    RecentProject,
    RecentProjectStats,
    RecentProjectStatsAgent,
)
from aiconsole.core.recent_projects.registry import recent_projects_stats

_RECENT_PROJECTS_LAST_CHATS_COUNT = 4


def _get_user_recent_projects_file():
    return Path(user_config_dir("aiconsole")) / "recent"


def _read_recent_projects():
    recent_projects_file = _get_user_recent_projects_file()
    if recent_projects_file.exists():
        recent_projects = [Path(path_str) for path_str in recent_projects_file.read_text().splitlines()]
    else:
        recent_projects = []

    return recent_projects


def _save_recent_projects(recent_projects: list[Path]):
    recent_projects_file = _get_user_recent_projects_file()
    recent_projects_file.parent.mkdir(parents=True, exist_ok=True)
    recent_projects_file.write_text("\n".join(str(p) for p in recent_projects))


async def add_to_recent_projects(project_path: Path):
    recent_projects = _read_recent_projects()
    recent_projects.insert(0, project_path)

    # only unique but keep order
    recent_projects = list(dict.fromkeys(recent_projects))

    # limit to MAX_RECENT_PROJECTS
    if len(recent_projects) > MAX_RECENT_PROJECTS:
        recent_projects = recent_projects[:MAX_RECENT_PROJECTS]

    _save_recent_projects(recent_projects)


async def remove_from_recent_projects(project_path: Path):
    recent_projects = _read_recent_projects()
    recent_projects.remove(project_path)
    _save_recent_projects(recent_projects)


async def get_recent_project() -> list[RecentProject]:
    recent_projects = _read_recent_projects()

    recent_projects_real = []

    for path in recent_projects:
        chat_ids = list_possible_historic_chat_ids(path)
        materials_count = recent_projects_stats.get_materials_counts(path)
        agents_count = recent_projects_stats.get_agents_count(path)
        recent_projects_real.append(
            RecentProject(
                name=os.path.basename(path),
                path=path,
                recent_chats=[
                    (await load_chat_history(id, path)).name for id in chat_ids[_RECENT_PROJECTS_LAST_CHATS_COUNT:]
                ],
                stats=RecentProjectStats(
                    materials_note_count=materials_count.note,
                    materials_dynamic_note_count=materials_count.dynamic_note,
                    materials_python_api_count=materials_count.python_api,
                    chats_count=len(chat_ids),
                    agents=RecentProjectStatsAgent(count=agents_count.count, agent_ids=agents_count.agent_ids),
                ),
            )
        )

    return recent_projects_real
