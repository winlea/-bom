from flask import Blueprint

bp = Blueprint("projects", __name__)

from . import api, pages  # noqa
