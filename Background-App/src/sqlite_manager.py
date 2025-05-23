class SQLiteManager:
    def __init__(self, conn):
        self.conn = conn
        self.create_tables()
        self.migrate_tables()

    def create_tables(self):
        with self.conn:
            self.conn.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
                department TEXT,
                phone TEXT,
                avatar_url TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );
            """)
            self.conn.execute("""
            CREATE TABLE IF NOT EXISTS leave_requests (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                leave_type TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                reason TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                requested_at TEXT DEFAULT (datetime('now')),
                reviewed_at TEXT,
                reviewer_id TEXT,
                comments TEXT,
                FOREIGN KEY (user_id) REFERENCES profiles(id)
            );
            """)
            self.conn.execute("""
            CREATE TABLE IF NOT EXISTS leave_balances (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                leave_type TEXT NOT NULL,
                year INTEGER NOT NULL,
                total_allotted INTEGER NOT NULL,
                total_taken INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES profiles(id)
            );
            """)
            self.conn.execute("""
            CREATE TABLE IF NOT EXISTS leave_types (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                default_allotment_days INTEGER,
                is_active INTEGER DEFAULT 1
            );
            """)
            self.conn.execute("""
            CREATE TABLE IF NOT EXISTS company_settings (
                setting_name TEXT PRIMARY KEY,
                setting_value TEXT NOT NULL,
                description TEXT,
                updated_at TEXT DEFAULT (datetime('now'))
            );
            """)
            self.conn.execute("""
            CREATE TABLE IF NOT EXISTS app_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                timestamp TEXT,
                app_name TEXT,
                window_title TEXT
            );
            """)
            self.conn.execute("""
            CREATE TABLE IF NOT EXISTS screenshots (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                captured_at_local TEXT
            );
            """)

    def migrate_tables(self):
        # Add missing columns to app_usage
        columns = [row[1] for row in self.conn.execute("PRAGMA table_info(app_usage)").fetchall()]
        for col, sql in [
            ("keystroke_count", "ALTER TABLE app_usage ADD COLUMN keystroke_count INTEGER DEFAULT 0"),
            ("mouse_event_count", "ALTER TABLE app_usage ADD COLUMN mouse_event_count INTEGER DEFAULT 0"),
            ("mouse_movement_distance", "ALTER TABLE app_usage ADD COLUMN mouse_movement_distance INTEGER DEFAULT 0"),
            ("scroll_events", "ALTER TABLE app_usage ADD COLUMN scroll_events INTEGER DEFAULT 0"),
            ("idle_time_seconds", "ALTER TABLE app_usage ADD COLUMN idle_time_seconds INTEGER DEFAULT 0"),
            ("duration_seconds", "ALTER TABLE app_usage ADD COLUMN duration_seconds INTEGER DEFAULT 0"),
            ("is_synced", "ALTER TABLE app_usage ADD COLUMN is_synced INTEGER DEFAULT 0"),
            ("created_at_local", "ALTER TABLE app_usage ADD COLUMN created_at_local TEXT DEFAULT CURRENT_TIMESTAMP"),
        ]:
            if col not in columns:
                self.conn.execute(sql)
        # Add missing columns to screenshots
        columns = [row[1] for row in self.conn.execute("PRAGMA table_info(screenshots)").fetchall()]
        for col, sql in [
            ("local_file_path", "ALTER TABLE screenshots ADD COLUMN local_file_path TEXT"),
            ("storage_path_supabase", "ALTER TABLE screenshots ADD COLUMN storage_path_supabase TEXT"),
            ("is_synced", "ALTER TABLE screenshots ADD COLUMN is_synced INTEGER DEFAULT 0"),
            ("created_at_local", "ALTER TABLE screenshots ADD COLUMN created_at_local TEXT DEFAULT CURRENT_TIMESTAMP"),
        ]:
            if col not in columns:
                self.conn.execute(sql) 