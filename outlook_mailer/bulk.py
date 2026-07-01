from __future__ import annotations

import csv
import logging
import time
from pathlib import Path

from tqdm import tqdm

from .mailer import Mailer
from .templates import TemplateManager

logger = logging.getLogger(__name__)


class BulkSender:
    def __init__(
        self,
        mailer: Mailer | None,
        delay: float = 0.5,
        max_retries: int = 2,
        retry_backoff: float = 2.0,
    ) -> None:
        self._mailer = mailer
        self._delay = delay
        self._max_retries = max_retries
        self._retry_backoff = retry_backoff

    def _send_with_retry(
        self,
        email: str,
        subject: str,
        template_name: str,
        context: dict,
    ) -> None:
        if self._mailer is None:
            raise RuntimeError("BulkSender has no mailer configured")
        attempt = 0
        while True:
            try:
                self._mailer.send_template(
                    to=email,
                    subject=subject,
                    template_name=template_name,
                    context=context,
                )
                return
            except Exception as exc:
                if attempt >= self._max_retries:
                    raise
                wait = self._retry_backoff * (2 ** attempt)
                logger.warning(
                    "Retry %d/%d for %s after %.1fs — %s",
                    attempt + 1, self._max_retries, email, wait, exc,
                )
                time.sleep(wait)
                attempt += 1

    def send_from_csv(
        self,
        csv_path: str | Path,
        template_name: str,
        subject: str,
        base_context: dict | None = None,
        dry_run: bool = False,
    ) -> dict[str, list[str]]:
        """
        Send templated emails to all rows in a CSV file.

        CSV must have at minimum an 'email' column. All columns are merged
        into the template context (row values override base_context).

        Returns a dict with 'success' and 'failed' lists of email addresses.
        """
        path = Path(csv_path)
        if not path.exists():
            raise FileNotFoundError(f"CSV not found: {path}")

        rows = list(csv.DictReader(path.open(encoding="utf-8")))
        if not rows:
            logger.warning("CSV is empty: %s", path)
            return {"success": [], "failed": []}

        if "email" not in rows[0]:
            raise ValueError("CSV must have an 'email' column")

        results: dict[str, list[str]] = {"success": [], "failed": []}
        tpl_manager = TemplateManager() if dry_run else None

        for row in tqdm(rows, desc="Sending emails", unit="email"):
            email = row["email"].strip()
            context = {**(base_context or {}), **row}
            if dry_run:
                try:
                    tpl_manager.render(template_name, context)  # type: ignore[union-attr]
                    logger.info("[dry-run] Would send to %s", email)
                    results["success"].append(email)
                except Exception as exc:
                    logger.error("[dry-run] Template failed for %s: %s", email, exc)
                    results["failed"].append(email)
                continue
            try:
                self._send_with_retry(email, subject, template_name, context)
                results["success"].append(email)
                logger.info("Sent to %s", email)
            except Exception as exc:
                logger.error("Failed to send to %s: %s", email, exc)
                results["failed"].append(email)

            if self._delay > 0:
                time.sleep(self._delay)

        total = len(rows)
        ok = len(results["success"])
        fail = len(results["failed"])
        logger.info("Bulk send complete: %d/%d succeeded, %d failed", ok, total, fail)
        return results
