#!/usr/bin/env bash
set -euo pipefail

# ─── COLORS ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ─── PATHS ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENV_DIR="$APP_ROOT/venv"

cd "$APP_ROOT"

# ─── CHECKS ──────────────────────────────────────────────────────────────────
command -v python3 >/dev/null 2>&1 || {
  echo -e "${RED}Python 3 is not installed. Please install Python 3 first.${NC}"
  exit 1
}

# ─── SETUP VENV ───────────────────────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
  echo -e "${GREEN}Creating virtual environment in ${VENV_DIR}...${NC}"
  python3 -m venv "$VENV_DIR"
fi

echo -e "${GREEN}Activating virtual environment...${NC}"
# shellcheck disable=SC1090
source "$VENV_DIR/bin/activate"

echo -e "${GREEN}Upgrading pip & installing dependencies...${NC}"
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# ─── PREPARE LOGS ─────────────────────────────────────────────────────────────
LOG_DIR="$APP_ROOT/data/logs"
if [ ! -d "$LOG_DIR" ]; then
  echo -e "${GREEN}Creating log directory at ${LOG_DIR}...${NC}"
  mkdir -p "$LOG_DIR"
fi

# ─── INSTALL PACKAGE ─────────────────────────────────────────────────────────
echo -e "${GREEN}Installing your package in editable mode...${NC}"
pip install -e .

# ─── CHECK .env ──────────────────────────────────────────────────────────────
if [ ! -f "$APP_ROOT/.env" ]; then
  echo -e "${RED}ERROR: .env file not found in $APP_ROOT. Please create one with your Supabase credentials.${NC}"
  exit 1
fi

# ─── RUN THE APP ─────────────────────────────────────────────────────────────
echo -e "${GREEN}Sourcing .env and launching WorkMatrix...${NC}"
set -a
# shellcheck disable=SC1090
source "$APP_ROOT/.env"
set +a

# **IMPORTANT**: run as a package so that your relative imports work
python3 -m src.main
