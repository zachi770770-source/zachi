from __future__ import annotations

import logging
import mimetypes
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from .config import SMTPConfig

logger = logging.getLogger(__name__)


class SMTPClient:
    def __init__(self, config: SMTPConfig) -> None:
        self._cfg = config

    def send_email(
        self,
        to: list[str] | str,
        subject: str,
        body_html: str = "",
        body_text: str = "",
        attachments: list[str] | None = None,
        cc: list[str] | None = None,
        bcc: list[str] | None = None,
    ) -> None:
        recipients = [to] if isinstance(to, str) else to

        msg = MIMEMultipart("mixed")
        msg["From"] = self._cfg.user
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        if cc:
            msg["Cc"] = ", ".join(cc)

        alt = MIMEMultipart("alternative")
        if body_text:
            alt.attach(MIMEText(body_text, "plain", "utf-8"))
        if body_html:
            alt.attach(MIMEText(body_html, "html", "utf-8"))
        msg.attach(alt)

        for path_str in attachments or []:
            path = Path(path_str)
            mime_type, _ = mimetypes.guess_type(str(path))
            maintype, subtype = (mime_type or "application/octet-stream").split("/", 1)
            part = MIMEApplication(path.read_bytes(), Name=path.name)
            part["Content-Disposition"] = f'attachment; filename="{path.name}"'
            msg.attach(part)

        all_recipients = recipients + (cc or []) + (bcc or [])

        with smtplib.SMTP(self._cfg.host, self._cfg.port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(self._cfg.user, self._cfg.password)
            server.sendmail(self._cfg.user, all_recipients, msg.as_string())

        logger.info("Email sent via SMTP to %s | subject: %s", recipients, subject)
