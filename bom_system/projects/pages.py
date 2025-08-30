from flask import render_template

from . import bp


@bp.get("/projects")
def projects_page():
    return render_template("index.html")
