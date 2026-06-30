from __future__ import annotations

import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class SMTPConfig:
    user: str
    password: str
    host: str = "smtp-mail.outlook.com"
    port: int = 587


@dataclass
class GraphConfig:
    tenant_id: str
    client_id: str
    client_secret: str
    sender_email: str


@dataclass
class Config:
    backend: str
    smtp: SMTPConfig | None = field(default=None)
    graph: GraphConfig | None = field(default=None)


def load_config() -> Config:
    backend = os.getenv("BACKEND", "smtp").lower()
    if backend not in ("smtp", "graph"):
        raise ValueError(f"BACKEND must be 'smtp' or 'graph', got: {backend!r}")

    smtp_cfg: SMTPConfig | None = None
    graph_cfg: GraphConfig | None = None

    if backend == "smtp":
        user = os.getenv("SMTP_USER", "")
        password = os.getenv("SMTP_PASSWORD", "")
        if not user or not password:
            raise EnvironmentError("SMTP_USER and SMTP_PASSWORD must be set for SMTP backend")
        smtp_cfg = SMTPConfig(
            user=user,
            password=password,
            host=os.getenv("SMTP_HOST", "smtp-mail.outlook.com"),
            port=int(os.getenv("SMTP_PORT", "587")),
        )
    else:
        tenant_id = os.getenv("AZURE_TENANT_ID", "")
        client_id = os.getenv("AZURE_CLIENT_ID", "")
        client_secret = os.getenv("AZURE_CLIENT_SECRET", "")
        sender_email = os.getenv("SENDER_EMAIL", "")
        missing = [k for k, v in {
            "AZURE_TENANT_ID": tenant_id,
            "AZURE_CLIENT_ID": client_id,
            "AZURE_CLIENT_SECRET": client_secret,
            "SENDER_EMAIL": sender_email,
        }.items() if not v]
        if missing:
            raise EnvironmentError(f"Missing required env vars for Graph backend: {missing}")
        graph_cfg = GraphConfig(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
            sender_email=sender_email,
        )

    return Config(backend=backend, smtp=smtp_cfg, graph=graph_cfg)
