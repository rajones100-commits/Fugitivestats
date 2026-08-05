#!/usr/bin/env python3
"""Download the published Google Sheet and create the fast stats.json file."""

from __future__ import annotations
import csv
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTH0mxm65m-RPZTPj2DFojsQ8x5KxuzivANthibfnwkfdcbsx2WDziP3n3vaZzmfdkaCWCbTtuwk-IS/pub?gid=0&single=true&output=csv"
OUTPUT_FILE = Path(__file__).resolve().parent / "stats.json"

def normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value or "").strip().lower())

def number(value, default=0.0):
    try:
        text = str(value or "").strip().replace(",", "")
        if not text or text.startswith("#"):
            return default
        return float(text)
    except (ValueError, TypeError):
        return default

def integer(value) -> int:
    return int(number(value, 0))

def find_index(headers, aliases, start=0):
    normalised = [normalise(x) for x in headers]
    for alias in aliases:
        target = normalise(alias)
        for i in range(start, len(normalised)):
            if normalised[i] == target:
                return i
    return -1

def overs_to_balls(value) -> int:
    text = str(value or "").strip()
    if not text:
        return 0
    parts = text.split(".", 1)
    overs = integer(parts[0])
    balls = integer(parts[1]) if len(parts) > 1 else 0
    return overs * 6 + balls

def value(row, index):
    return row[index] if 0 <= index < len(row) else ""

def build_schema(headers):
    normalised = [normalise(x) for x in headers]
    overs = find_index(headers, ["O", "Overs"])
    average_indexes = [i for i, h in enumerate(normalised) if h in {"ave", "average"}]

    batting_average = find_index(headers, ["Bat Ave", "Batting Average", "Bat Average"])
    if batting_average < 0:
        batting_average = next((i for i in average_indexes if overs < 0 or i < overs), -1)

    bowling_average = find_index(headers, ["Bowl Ave", "Bowling Average", "Bowl Average"])
    if bowling_average < 0:
        bowling_average = next((i for i in reversed(average_indexes) if i > overs), -1)

    maidens = find_index(headers, ["Maidens"])
    if maidens < 0 and overs >= 0:
        try:
            maidens = normalised.index("m", overs + 1)
        except ValueError:
            maidens = -1

    conceded = find_index(headers, ["Runs Conceded", "R Conceded", "Conceded"])
    if conceded < 0 and overs >= 0:
        try:
            conceded = normalised.index("r", overs + 1)
        except ValueError:
            conceded = -1

    return {
        "player": find_index(headers, ["Player Name", "Player", "Name"]),
        "number": find_index(headers, ["Playing Number", "Player Number", "Number", "No.", "Cap Number"]),
        "debut": find_index(headers, ["Debut Year", "Debut", "First Year", "Year of Debut"]),
        "matches": find_index(headers, ["MT", "Matches"]),
        "innings": find_index(headers, ["In", "Innings"]),
        "not_outs": find_index(headers, ["NO", "Not Outs"]),
        "runs": find_index(headers, ["Runs"]),
        "fifties": find_index(headers, ["50's", "50s", "Fifties"]),
        "hundreds": find_index(headers, ["100's", "100s", "Hundreds"]),
        "bat_average": batting_average,
        "high_score": find_index(headers, ["HS", "High Score"]),
        "overs": overs,
        "maidens": maidens,
        "conceded": conceded,
        "wickets": find_index(headers, ["W", "Wickets"], max(0, overs + 1)),
        "economy": find_index(headers, ["ECON", "Economy", "Econ"]),
        "bowl_average": bowling_average,
    }

def main():
    request = urllib.request.Request(CSV_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        text = response.read().decode("utf-8-sig")

    rows = list(csv.reader(io.StringIO(text)))
    if not rows:
        raise RuntimeError("The published Google Sheet returned no data.")

    schema = build_schema(rows[0])
    if schema["player"] < 0:
        raise RuntimeError("A Player Name column could not be found.")

    players = []
    for row in rows[1:]:
        name = str(value(row, schema["player"])).strip()
        if not name:
            continue

        balls = overs_to_balls(value(row, schema["overs"]))
        players.append({
            "name": name,
            "number": str(value(row, schema["number"])).strip(),
            "debut": str(value(row, schema["debut"])).strip(),
            "matches": integer(value(row, schema["matches"])),
            "innings": integer(value(row, schema["innings"])),
            "notOuts": integer(value(row, schema["not_outs"])),
            "runs": integer(value(row, schema["runs"])),
            "fifties": integer(value(row, schema["fifties"])),
            "hundreds": integer(value(row, schema["hundreds"])),
            "batAverage": round(number(value(row, schema["bat_average"])), 8),
            "highScore": str(value(row, schema["high_score"])).strip(),
            "balls": balls,
            "overs": f"{balls // 6}.{balls % 6}",
            "maidens": integer(value(row, schema["maidens"])),
            "conceded": integer(value(row, schema["conceded"])),
            "wickets": integer(value(row, schema["wickets"])),
            "economy": round(number(value(row, schema["economy"])), 8),
            "bowlAverage": round(number(value(row, schema["bowl_average"])), 8),
        })

    if not players:
        raise RuntimeError("No player rows were found.")

    OUTPUT_FILE.write_text(
        json.dumps(players, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Updated {OUTPUT_FILE.name} with {len(players)} players.")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Update failed: {exc}", file=sys.stderr)
        raise
