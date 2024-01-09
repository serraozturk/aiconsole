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

import argparse
import logging
import os
from contextlib import asynccontextmanager
from logging import config

from uvicorn import run

from aiconsole.consts import log_config

config.dictConfig(log_config)

_log = logging.getLogger(__name__)


def run_aiconsole(dev: bool) -> None:
    parser = argparse.ArgumentParser(description="Start the backend server.")
    parser.add_argument("--port", type=int, help="Port to listen on.", default=8000)
    parser.add_argument("--origin", type=str, help="Origin for the frontend.", default="http://localhost:3000")

    port = parser.parse_args().port
    origin = parser.parse_args().origin
    os.environ["CORS_ORIGIN"] = origin

    try:
        run(
            "aiconsole.app:app",
            host="0.0.0.0",
            port=port,
            reload=dev,
            factory=True,
        )
    except KeyboardInterrupt:
        _log.info("Exiting ...")


def aiconsole_dev() -> None:
    run_aiconsole(dev=True)


def aiconsole() -> None:
    run_aiconsole(dev=False)


if __name__ == "__main__":
    aiconsole_dev()
