import pathlib
import sqlite3

database = sqlite3.connect(":memory:")
sql = (pathlib.Path(__file__).parents[1] / "drizzle" / "0000_hunter_profiles.sql").read_text()
database.executescript(sql)
columns = {row[1]: row for row in database.execute("PRAGMA table_info(hunters)")}
assert set(columns) == {"user_id", "state_json", "version", "updated_at"}
assert columns["user_id"][5] == 1
database.execute(
    "INSERT INTO hunters(user_id, state_json, updated_at) VALUES(?, ?, ?)",
    ("test-user", "{}", "2026-11-01T00:00:00Z"),
)
assert database.execute("SELECT version FROM hunters WHERE user_id = ?", ("test-user",)).fetchone()[0] == 0
print("Hunter D1 schema migration passed.")
