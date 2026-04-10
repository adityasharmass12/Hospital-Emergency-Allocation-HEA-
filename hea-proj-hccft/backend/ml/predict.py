import os, pickle
from datetime import date, timedelta

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'hea_model.pkl')


INDIAN_HOLIDAYS = {
    "01-01", "01-26", "03-25", "04-14", "05-01",
    "08-15", "10-02", "10-12", "10-13", "11-01",
    "11-02", "12-25",
}

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _is_holiday(d: date) -> int:
    return 1 if d.strftime("%m-%d") in INDIAN_HOLIDAYS else 0


def _rule_based(d: date):