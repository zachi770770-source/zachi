from __future__ import annotations

import logging

from .config import Config, load_config
from .graph_client import GraphClient
from .smtp_client import SMTPClient
from .templates import TemplateManager

logger = logging.getLogger(__name__)


class Mailer:
    def __init__(self, config: Config | None = None) -> None:
        self._cfg = config or load_config()
        if self._cfg.backend == "smtp":
            self._client: SMTPClient | GraphClient = SMTPClient(self._cfg.smtp)  # type: ignore[arg-type]
        else:
            self._client = GraphClient(self._cfg.graph)  # type: ignore[arg-type]
        self._templates = TemplateManager()

    def send(
        self,
        to: list[str] | str,
        subject: str,
        body_html: str = "",
        body_text: str = "",
        attachments: list[str] | None = None,
        cc: list[str] | None = None,
        bcc: list[str] | None = None,
    ) -> None:
        self._client.send_email(
            to=to,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            attachments=attachments,
            cc=cc,
            bcc=bcc,
        )

    def send_template(
        self,
        to: list[str] | str,
        subject: str,
        template_name: str,
        context: dict,
        attachments: list[str] | None = None,
        cc: list[str] | None = None,
        bcc: list[str] | None = None,
    ) -> None:
        html, text = self._templates.render(template_name, context)
        self.send(
            to=to,
            subject=subject,
            body_html=html,
            body_text=text,
            attachments=attachments,
            cc=cc,
            bcc=bcc,
        )
