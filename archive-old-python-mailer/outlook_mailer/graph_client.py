from __future__ import annotations

import base64
import logging
from pathlib import Path

import msal
import requests

from .config import GraphConfig

logger = logging.getLogger(__name__)

GRAPH_SCOPE = ["https://graph.microsoft.com/.default"]
SEND_MAIL_URL = "https://graph.microsoft.com/v1.0/users/{sender}/sendMail"


class GraphClient:
    def __init__(self, config: GraphConfig) -> None:
        self._cfg = config
        self._app = msal.ConfidentialClientApplication(
            client_id=config.client_id,
            authority=f"https://login.microsoftonline.com/{config.tenant_id}",
            client_credential=config.client_secret,
        )

    def _get_token(self) -> str:
        result = self._app.acquire_token_silent(GRAPH_SCOPE, account=None)
        if not result:
            result = self._app.acquire_token_for_client(scopes=GRAPH_SCOPE)
        if "access_token" not in result:
            raise RuntimeError(f"Failed to acquire token: {result.get('error_description')}")
        return result["access_token"]

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

        body_content = body_html if body_html else body_text
        body_type = "HTML" if body_html else "Text"

        payload: dict = {
            "message": {
                "subject": subject,
                "body": {"contentType": body_type, "content": body_content},
                "toRecipients": [{"emailAddress": {"address": r}} for r in recipients],
            },
            "saveToSentItems": True,
        }

        if cc:
            payload["message"]["ccRecipients"] = [
                {"emailAddress": {"address": r}} for r in cc
            ]
        if bcc:
            payload["message"]["bccRecipients"] = [
                {"emailAddress": {"address": r}} for r in bcc
            ]

        if attachments:
            encoded = []
            for path_str in attachments:
                path = Path(path_str)
                content_b64 = base64.b64encode(path.read_bytes()).decode()
                encoded.append({
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    "name": path.name,
                    "contentBytes": content_b64,
                })
            payload["message"]["attachments"] = encoded

        token = self._get_token()
        url = SEND_MAIL_URL.format(sender=self._cfg.sender_email)
        resp = requests.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=30,
        )

        if resp.status_code not in (200, 202):
            raise RuntimeError(
                f"Graph API error {resp.status_code}: {resp.text}"
            )

        logger.info("Email sent via Graph API to %s | subject: %s", recipients, subject)
