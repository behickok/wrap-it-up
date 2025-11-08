-- Migration: create family_history table

CREATE TABLE IF NOT EXISTS family_history (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL UNIQUE,
	parents_names TEXT,
	siblings_names TEXT,
	children_names TEXT,
	grandchildren_names TEXT,
	spouse_info TEXT,
	family_stories TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id)
);
