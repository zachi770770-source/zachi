from unittest.mock import MagicMock

import pytest

from outlook_mailer.bulk import BulkSender


@pytest.fixture
def csv_file(tmp_path):
    path = tmp_path / "contacts.csv"
    path.write_text(
        "email,name\n"
        "a@example.com,Ada\n"
        "b@example.com,Boaz\n",
        encoding="utf-8",
    )
    return path


@pytest.fixture
def templates_dir(tmp_path, monkeypatch):
    d = tmp_path / "templates"
    d.mkdir()
    (d / "hi.html").write_text("<p>Hi {{ name }}</p>", encoding="utf-8")
    monkeypatch.chdir(tmp_path)
    return d


def test_send_from_csv_success(csv_file, templates_dir):
    mailer = MagicMock()
    sender = BulkSender(mailer, delay=0, max_retries=0)

    results = sender.send_from_csv(
        csv_path=csv_file, template_name="hi", subject="s",
    )

    assert results["success"] == ["a@example.com", "b@example.com"]
    assert results["failed"] == []
    assert mailer.send_template.call_count == 2


def test_send_from_csv_retries_transient_error(csv_file, templates_dir):
    mailer = MagicMock()
    mailer.send_template.side_effect = [RuntimeError("boom"), None, None]

    sender = BulkSender(mailer, delay=0, max_retries=1, retry_backoff=0)
    results = sender.send_from_csv(
        csv_path=csv_file, template_name="hi", subject="s",
    )

    assert results["success"] == ["a@example.com", "b@example.com"]
    assert results["failed"] == []
    assert mailer.send_template.call_count == 3  # 1 retry + 2 successes


def test_send_from_csv_records_failures_after_retries(csv_file, templates_dir):
    mailer = MagicMock()
    mailer.send_template.side_effect = RuntimeError("boom")

    sender = BulkSender(mailer, delay=0, max_retries=1, retry_backoff=0)
    results = sender.send_from_csv(
        csv_path=csv_file, template_name="hi", subject="s",
    )

    assert results["success"] == []
    assert results["failed"] == ["a@example.com", "b@example.com"]
    # 2 attempts per address (initial + 1 retry) × 2 addresses
    assert mailer.send_template.call_count == 4


def test_dry_run_renders_but_does_not_send(csv_file, templates_dir):
    sender = BulkSender(mailer=None, delay=0)
    results = sender.send_from_csv(
        csv_path=csv_file, template_name="hi", subject="s", dry_run=True,
    )
    assert results["success"] == ["a@example.com", "b@example.com"]
    assert results["failed"] == []


def test_dry_run_records_template_failures(csv_file, templates_dir):
    sender = BulkSender(mailer=None, delay=0)
    results = sender.send_from_csv(
        csv_path=csv_file, template_name="missing", subject="s", dry_run=True,
    )
    assert results["success"] == []
    assert results["failed"] == ["a@example.com", "b@example.com"]


def test_missing_csv_raises(tmp_path):
    sender = BulkSender(MagicMock(), delay=0)
    with pytest.raises(FileNotFoundError):
        sender.send_from_csv(
            csv_path=tmp_path / "nope.csv", template_name="hi", subject="s",
        )


def test_csv_without_email_column_raises(tmp_path, templates_dir):
    bad = tmp_path / "bad.csv"
    bad.write_text("name\nAda\n", encoding="utf-8")

    sender = BulkSender(MagicMock(), delay=0)
    with pytest.raises(ValueError, match="email"):
        sender.send_from_csv(csv_path=bad, template_name="hi", subject="s")
