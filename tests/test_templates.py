import pytest

from outlook_mailer.templates import TemplateManager


@pytest.fixture
def templates_dir(tmp_path):
    (tmp_path / "hi.html").write_text(
        "<p>Hello {{ name }}</p>", encoding="utf-8"
    )
    (tmp_path / "hi.txt").write_text(
        "Hello {{ name }}", encoding="utf-8"
    )
    (tmp_path / "html_only.html").write_text(
        "<p>{{ x }}</p>", encoding="utf-8"
    )
    return tmp_path


def test_render_returns_html_and_text(templates_dir):
    tm = TemplateManager(templates_dir)
    html, text = tm.render("hi", {"name": "Ada"})
    assert html == "<p>Hello Ada</p>"
    assert text == "Hello Ada"


def test_render_html_only_returns_empty_text(templates_dir):
    tm = TemplateManager(templates_dir)
    html, text = tm.render("html_only", {"x": "y"})
    assert html == "<p>y</p>"
    assert text == ""


def test_render_missing_raises(templates_dir):
    tm = TemplateManager(templates_dir)
    with pytest.raises(FileNotFoundError):
        tm.render("does_not_exist", {})


def test_html_autoescapes_but_text_does_not(templates_dir):
    tm = TemplateManager(templates_dir)
    html, text = tm.render("hi", {"name": "<script>x</script>"})
    assert "&lt;script&gt;" in html
    assert "<script>x</script>" in text
