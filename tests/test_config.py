import pytest

from outlook_mailer.config import load_config


@pytest.fixture(autouse=True)
def clear_env(monkeypatch):
    for key in (
        "BACKEND",
        "SMTP_USER", "SMTP_PASSWORD", "SMTP_HOST", "SMTP_PORT",
        "AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET", "SENDER_EMAIL",
    ):
        monkeypatch.delenv(key, raising=False)


def test_smtp_backend_reads_env(monkeypatch):
    monkeypatch.setenv("BACKEND", "smtp")
    monkeypatch.setenv("SMTP_USER", "u@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "pw")
    monkeypatch.setenv("SMTP_PORT", "25")

    cfg = load_config()

    assert cfg.backend == "smtp"
    assert cfg.smtp is not None
    assert cfg.smtp.user == "u@example.com"
    assert cfg.smtp.password == "pw"
    assert cfg.smtp.port == 25
    assert cfg.smtp.host == "smtp-mail.outlook.com"  # default


def test_smtp_missing_credentials_raises(monkeypatch):
    monkeypatch.setenv("BACKEND", "smtp")
    with pytest.raises(EnvironmentError, match="SMTP_USER"):
        load_config()


def test_graph_backend_reads_env(monkeypatch):
    monkeypatch.setenv("BACKEND", "graph")
    monkeypatch.setenv("AZURE_TENANT_ID", "tid")
    monkeypatch.setenv("AZURE_CLIENT_ID", "cid")
    monkeypatch.setenv("AZURE_CLIENT_SECRET", "sec")
    monkeypatch.setenv("SENDER_EMAIL", "from@x.com")

    cfg = load_config()

    assert cfg.backend == "graph"
    assert cfg.graph is not None
    assert cfg.graph.tenant_id == "tid"
    assert cfg.graph.sender_email == "from@x.com"


def test_graph_missing_credentials_lists_all(monkeypatch):
    monkeypatch.setenv("BACKEND", "graph")
    monkeypatch.setenv("AZURE_TENANT_ID", "tid")

    with pytest.raises(EnvironmentError) as exc_info:
        load_config()

    msg = str(exc_info.value)
    assert "AZURE_CLIENT_ID" in msg
    assert "AZURE_CLIENT_SECRET" in msg
    assert "SENDER_EMAIL" in msg


def test_invalid_backend_raises(monkeypatch):
    monkeypatch.setenv("BACKEND", "pigeon")
    with pytest.raises(ValueError, match="BACKEND"):
        load_config()
