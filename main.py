#!/usr/bin/env python3
"""Outlook email automation CLI."""
from __future__ import annotations

import argparse
import json
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)


def cmd_send(args: argparse.Namespace) -> None:
    from outlook_mailer import Mailer

    to = [e.strip() for e in args.to.split(",")]
    cc = [e.strip() for e in args.cc.split(",")] if args.cc else None
    bcc = [e.strip() for e in args.bcc.split(",")] if args.bcc else None
    attachments = args.attach or None

    body_html = args.body if args.html else ""
    body_text = "" if args.html else args.body

    if args.dry_run:
        print("[dry-run] Would send:")
        print(f"  to:   {to}")
        if cc: print(f"  cc:   {cc}")
        if bcc: print(f"  bcc:  {bcc}")
        print(f"  subj: {args.subject}")
        print(f"  type: {'HTML' if args.html else 'text'}")
        if attachments: print(f"  attach: {attachments}")
        return

    mailer = Mailer()
    mailer.send(
        to=to,
        subject=args.subject,
        body_html=body_html,
        body_text=body_text,
        attachments=attachments,
        cc=cc,
        bcc=bcc,
    )
    print(f"✓ Email sent to {to}")


def cmd_send_template(args: argparse.Namespace) -> None:
    from outlook_mailer import Mailer

    to = [e.strip() for e in args.to.split(",")]

    context = json.loads(args.context) if args.context else {}
    if args.name:
        context["name"] = args.name
    if args.message:
        context["message"] = args.message

    if args.dry_run:
        from outlook_mailer.templates import TemplateManager

        html, text = TemplateManager().render(args.template, context)
        print("[dry-run] Would send template:")
        print(f"  to:       {to}")
        print(f"  subject:  {args.subject}")
        print(f"  template: {args.template}")
        print(f"  context:  {context}")
        preview = (html or text)[:200]
        print(f"  preview:  {preview}{'...' if len(html or text) > 200 else ''}")
        return

    mailer = Mailer()
    mailer.send_template(
        to=to,
        subject=args.subject,
        template_name=args.template,
        context=context,
        attachments=args.attach or None,
    )
    print(f"✓ Template '{args.template}' sent to {to}")


def cmd_bulk(args: argparse.Namespace) -> None:
    from outlook_mailer import BulkSender, Mailer

    base_context = json.loads(args.context) if args.context else {}
    mailer = None if args.dry_run else Mailer()
    sender = BulkSender(mailer, delay=args.delay, max_retries=args.max_retries)
    results = sender.send_from_csv(
        csv_path=args.csv,
        template_name=args.template,
        subject=args.subject,
        base_context=base_context,
        dry_run=args.dry_run,
    )
    prefix = "[dry-run] " if args.dry_run else ""
    print(f"✓ {prefix}Done — success: {len(results['success'])}, failed: {len(results['failed'])}")
    if results["failed"]:
        print("Failed addresses:")
        for addr in results["failed"]:
            print(f"  ✗ {addr}")


def cmd_test(args: argparse.Namespace) -> None:  # noqa: ARG001
    from outlook_mailer import Mailer
    from outlook_mailer.config import load_config

    cfg = load_config()
    sender = cfg.smtp.user if cfg.backend == "smtp" else cfg.graph.sender_email  # type: ignore[union-attr]

    mailer = Mailer(cfg)
    mailer.send(
        to=sender,
        subject="[Test] Outlook Mailer works!",
        body_html="<h2>הכלי עובד!</h2><p>זהו אימייל בדיקה.</p>",
        body_text="הכלי עובד! זהו אימייל בדיקה.",
    )
    print(f"✓ Test email sent to {sender}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="outlook-mailer",
        description="Outlook email automation — Graph API or SMTP",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # ── send ──────────────────────────────────────────────────────────────────
    p_send = sub.add_parser("send", help="Send a plain / HTML email")
    p_send.add_argument("--to", required=True, help="Recipient(s), comma-separated")
    p_send.add_argument("--subject", required=True)
    p_send.add_argument("--body", required=True, help="Message body")
    p_send.add_argument("--html", action="store_true", help="Treat --body as HTML")
    p_send.add_argument("--attach", nargs="+", metavar="FILE", help="Attachment paths")
    p_send.add_argument("--cc", help="CC recipients, comma-separated")
    p_send.add_argument("--bcc", help="BCC recipients, comma-separated")
    p_send.add_argument("--dry-run", action="store_true", help="Preview without sending")
    p_send.set_defaults(func=cmd_send)

    # ── send-template ─────────────────────────────────────────────────────────
    p_tpl = sub.add_parser("send-template", help="Send a Jinja2 template email")
    p_tpl.add_argument("--to", required=True, help="Recipient(s), comma-separated")
    p_tpl.add_argument("--subject", required=True)
    p_tpl.add_argument("--template", required=True, help="Template name (without extension)")
    p_tpl.add_argument("--name", help="Recipient name (shortcut for --context)")
    p_tpl.add_argument("--message", help="Message body (shortcut for --context)")
    p_tpl.add_argument("--context", help="JSON string with template variables")
    p_tpl.add_argument("--attach", nargs="+", metavar="FILE")
    p_tpl.add_argument("--dry-run", action="store_true", help="Render preview without sending")
    p_tpl.set_defaults(func=cmd_send_template)

    # ── bulk ──────────────────────────────────────────────────────────────────
    p_bulk = sub.add_parser("bulk", help="Send template emails from a CSV file")
    p_bulk.add_argument("--csv", required=True, help="Path to CSV (must have 'email' column)")
    p_bulk.add_argument("--template", required=True, help="Template name")
    p_bulk.add_argument("--subject", required=True)
    p_bulk.add_argument("--context", help="JSON string with base context variables")
    p_bulk.add_argument("--delay", type=float, default=0.5, help="Delay in seconds between sends")
    p_bulk.add_argument("--max-retries", type=int, default=2, help="Retries per failed send")
    p_bulk.add_argument("--dry-run", action="store_true",
                        help="Render templates but do not send")
    p_bulk.set_defaults(func=cmd_bulk)

    # ── test ──────────────────────────────────────────────────────────────────
    p_test = sub.add_parser("test", help="Send a test email to the configured sender")
    p_test.set_defaults(func=cmd_test)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    try:
        args.func(args)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
