#!/usr/bin/env python3
"""
Seed script to populate Hindsight with realistic organizational memories.
Reads synthetic_data/organizational_memories.json and stores each case
into Hindsight using the official hindsight-client SDK.
Safe to run multiple times (idempotent replacement via document_id).
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from hindsight_client import Hindsight

# Load environment variables from project root .env
root_dir = Path(__file__).resolve().parent.parent
load_dotenv(root_dir / ".env")

API_KEY = os.getenv("HINDSIGHT_API_KEY")
BANK_ID = os.getenv("HINDSIGHT_BANK_ID", "MAICROBOTS")
BASE_URL = os.getenv("HINDSIGHT_ENDPOINT", "https://api.hindsight.vectorize.io")

if not API_KEY:
    print("ERROR: HINDSIGHT_API_KEY is not set in .env")
    sys.exit(1)


def format_memory_content(case: dict) -> str:
    symptoms_str = "\n  - " + "\n  - ".join(case.get("symptoms", []))
    return (
        f"Case ID: {case['case_id']}\n"
        f"Scenario: {case['scenario']}\n"
        f"Entity/Service: {case['entity']}\n"
        f"Problem: {case['problem']}\n"
        f"Operational Context: {case['context']}\n"
        f"Observed Symptoms:{symptoms_str}\n"
        f"Root Cause: {case['root_cause']}\n"
        f"Action Attempted: {case['action_attempted']}\n"
        f"Action Outcome: {case['outcome']} ({case['worked_or_failed']})\n"
        f"Resolution Details: {case['final_resolution']}\n"
        f"Organizational Lesson Learned: {case['lesson_learned']}"
    )


def seed():
    data_path = root_dir / "synthetic_data" / "organizational_memories.json"
    if not data_path.exists():
        print(f"ERROR: Synthetic data file not found at {data_path}")
        sys.exit(1)

    with open(data_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    print(f"Connecting to Hindsight at {BASE_URL} (Bank: '{BANK_ID}')...")
    client = Hindsight(base_url=BASE_URL, api_key=API_KEY)

    try:
        # Check or ensure bank exists
        try:
            client.create_bank(
                bank_id=BANK_ID,
                retain_mission="Extract operational incidents, root causes, failed actions, successful fixes, and architectural lessons.",
                reflect_mission="Synthesize institutional knowledge to guide engineers diagnosing operational incidents.",
                background="Institutional operational incident knowledge base containing postmortems, failed remediation attempts, and verified resolutions."
            )
            print(f"Bank '{BANK_ID}' ensured/configured.")
        except Exception as e:
            # If bank already exists or user doesn't have permissions to recreate, proceed
            print(f"Note on create_bank: {e}. Proceeding to retain memories.")

        print(f"Seeding {len(cases)} organizational memory cases...")
        success_count = 0

        for case in cases:
            case_id = case["case_id"]
            scenario = case["scenario"]
            outcome = case["outcome"]
            content = format_memory_content(case)
            
            # Parse timestamp if present
            ts = None
            if "timestamp" in case:
                try:
                    ts = datetime.fromisoformat(case["timestamp"].replace("Z", "+00:00"))
                except Exception:
                    ts = None

            metadata = {
                "case_id": case_id,
                "scenario": scenario,
                "outcome": outcome,
                "entity": case["entity"]
            }
            tags = [
                scenario.lower().replace(" ", "_"),
                outcome.lower(),
                case_id.lower()
            ]

            print(f"-> Retaining [{case_id}] {scenario} ({outcome})...", end=" ")
            try:
                res = client.retain(
                    bank_id=BANK_ID,
                    content=content,
                    document_id=case_id,
                    metadata=metadata,
                    tags=tags,
                    timestamp=ts,
                    update_mode="replace"
                )
                print("SUCCESS")
                success_count += 1
            except Exception as ex:
                print(f"FAILED: {ex}")

        print(f"\nSeeding complete! Successfully retained {success_count}/{len(cases)} cases in Hindsight.")
    finally:
        client.close()


if __name__ == "__main__":
    seed()
