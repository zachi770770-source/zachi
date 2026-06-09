from __future__ import annotations

from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape


class TemplateManager:
    def __init__(self, templates_dir: str | Path = "templates") -> None:
        self._dir = Path(templates_dir)
        self._env = Environment(
            loader=FileSystemLoader(str(self._dir)),
            autoescape=select_autoescape(["html", "xml"]),
        )

    def render(self, template_name: str, context: dict) -> tuple[str, str]:
        """Return (html, plain_text). Missing variant returns empty string."""
        html = ""
        text = ""

        html_file = f"{template_name}.html"
        text_file = f"{template_name}.txt"

        if (self._dir / html_file).exists():
            html = self._env.get_template(html_file).render(**context)

        if (self._dir / text_file).exists():
            text_env = Environment(
                loader=FileSystemLoader(str(self._dir)),
                autoescape=False,
            )
            text = text_env.get_template(text_file).render(**context)

        if not html and not text:
            raise FileNotFoundError(
                f"No template found for '{template_name}' in {self._dir}"
            )

        return html, text
