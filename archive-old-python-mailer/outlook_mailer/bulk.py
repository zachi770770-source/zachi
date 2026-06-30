from __future__ import annotations

import csv
import logging
import time
from pathlib import Path

from tqdm import tqdm

from .mailer import Mailer

logger = logging.getLogger(__name__)


class BulkSender:
    def __init__(self, mailer: Mailer, delay: float = 0.5) -> None:
        self._mailer = mailer
        self._delay = delay

    def send_from_csv(
        self,
        csv_path: str | Path,
        template_name: str,
        subject: str,
        base_context: dict | None = None,
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

        for row in tqdm(rows, desc="Sending emails", unit="email"):
            email = row["email"].strip()
            context = {**(base_context or {}), **row}
            try:
                self._mailer.send_template(
                    to=email,
                    subject=subject,
                    template_name=template_name,
                    context=context,
                )
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
