#!/usr/bin/env python3
"""
RodStack V2 — Python AI Gateway
================================
Standalone Python equivalent of src/lib/ai/claude.ts.
Use this for:
  - CLI tooling / admin scripts
  - Batch processing builds
  - Testing the AI layer independently of the Next.js app
  - Migrating to a separate Python microservice later

Requirements:
  pip install anthropic supabase python-dotenv

Environment variables (.env):
  ANTHROPIC_API_KEY=sk-ant-...
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...   <-- service role, NOT anon key
"""

from __future__ import annotations

import os
import sys
import json
import datetime
from dataclasses import dataclass, field, asdict
from typing import Iterator, Optional
from enum import Enum

# ---- Dependencies (with clear error if missing) ----
try:
    import anthropic
except ImportError:
    sys.exit("Missing dependency: pip install anthropic")

try:
    from supabase import create_client, Client
except ImportError:
    sys.exit("Missing dependency: pip install supabase")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional — env vars can be set directly


# ============================================================
# TIER CONFIGURATION
# Keep in sync with src/lib/ai/tiers.ts
# ============================================================

class PlanTier(str, Enum):
    FREE       = "free"
    PRO        = "pro"
    BUILDER    = "builder"
    ENTERPRISE = "enterprise"


@dataclass
class TierConfig:
    name:                str
    monthly_query_limit: Optional[int]   # None = unlimited
    max_output_tokens:   int
    model:               str
    streaming_enabled:   bool
    features:            list[str]


MODELS = {
    "fast":     "claude-haiku-4-5-20251001",
    "balanced": "claude-sonnet-4-6",
    "powerful": "claude-opus-4-6",
}

TIER_CONFIG: dict[str, TierConfig] = {
    PlanTier.FREE: TierConfig(
        name="Free",
        monthly_query_limit=25,
        max_output_tokens=512,
        model=MODELS["fast"],
        streaming_enabled=False,
        features=["rod_builder_suggestions"],
    ),
    PlanTier.PRO: TierConfig(
        name="Pro",
        monthly_query_limit=300,
        max_output_tokens=2048,
        model=MODELS["balanced"],
        streaming_enabled=True,
        features=[
            "rod_builder_suggestions",
            "guide_spacing_analysis",
            "material_selection",
            "build_critique",
        ],
    ),
    PlanTier.BUILDER: TierConfig(
        name="Builder Pro",
        monthly_query_limit=1500,
        max_output_tokens=4096,
        model=MODELS["balanced"],
        streaming_enabled=True,
        features=[
            "rod_builder_suggestions",
            "guide_spacing_analysis",
            "material_selection",
            "build_critique",
            "photo_analysis",
            "cost_optimization",
        ],
    ),
    PlanTier.ENTERPRISE: TierConfig(
        name="Enterprise",
        monthly_query_limit=None,
        max_output_tokens=8192,
        model=MODELS["powerful"],
        streaming_enabled=True,
        features=[
            "rod_builder_suggestions",
            "guide_spacing_analysis",
            "material_selection",
            "build_critique",
            "photo_analysis",
            "cost_optimization",
            "custom_system_prompt",
        ],
    ),
}


def get_tier_config(tier: str) -> TierConfig:
    return TIER_CONFIG.get(tier, TIER_CONFIG[PlanTier.FREE])


def current_billing_period() -> str:
    """Return current billing period as YYYY-MM."""
    now = datetime.datetime.utcnow()
    return f"{now.year}-{now.month:02d}"


# ============================================================
# SYSTEM PROMPTS
# Keep in sync with src/lib/ai/prompts.ts
# ============================================================

DOMAIN_PROMPT = """\
You are RodStack AI — a precision assistant for custom fishing rod builders.
You have deep expertise in:
- Rod blank specifications (graphite, fiberglass, composite; taper, modulus, power, action)
- Guide train design (REC spacing, AFFTA sizing, single/double foot, tip-top selection)
- Component selection (Fuji, Pacific Bay, American Tackle guide systems; reel seat fitting)
- Thread wrapping (size A/C/D/E; single-color, multi-color, chevrons, cross wraps)
- Epoxy finish (Flex Coat, ProKote, U-40; mixing ratios, cure times, temperature effects)
- Materials compatibility (blank OD vs. reel seat ID; handle bore sizing; bushing/shimming)
- Build economics (parts cost, labor time, pricing for commission builds)

CRITICAL RULES:
- Give technically precise answers. Rod builders are craftspeople — they want specifics.
- When you give measurements, always include units (inches, mm, lb, oz).
- If you are uncertain, say so and explain what additional information you need.
- Never recommend a component without explaining why it fits the specific build spec.
- Do not give generic fishing advice. Stay focused on the rod-building craft.\
"""


def build_system_prompt(build: Optional[dict] = None) -> str:
    """Construct the system prompt, optionally injecting build context."""
    prompt = DOMAIN_PROMPT
    if build:
        prompt += f"""

CURRENT BUILD CONTEXT:
The user is working on a build named "{build.get('name', 'Unknown')}".
Specifications:
- Length: {build.get('rod_length', 'not specified')}ft
- Power: {build.get('power', 'not specified')}
- Action: {build.get('action', 'not specified')}
- Blank Material: {build.get('blank_material', 'not specified')}
- Line Rating: {build.get('line_rating', 'not specified')}
- Lure Rating: {build.get('lure_rating', 'not specified')}
- Estimated Guide Count: {build.get('estimated_guide_count', 'not calculated')}

When answering questions, relate your advice to this specific build where relevant."""
    return prompt


# ============================================================
# SUPABASE CLIENT
# ============================================================

def get_supabase() -> Client:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise EnvironmentError(
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
        )
    return create_client(url, key)


# ============================================================
# USAGE TRACKING
# ============================================================

class QuotaExceededError(Exception):
    def __init__(self, tier: str, used: int, limit: int):
        self.tier  = tier
        self.used  = used
        self.limit = limit
        super().__init__(
            f"Monthly AI quota exceeded: {used}/{limit} queries used on '{tier}' plan."
        )


def get_user_tier(supabase: Client, user_id: str) -> str:
    """Fetch the user's plan tier from Supabase profiles."""
    result = (
        supabase.table("profiles")
        .select("plan_tier, subscription_status")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    data = result.data
    if not data:
        return PlanTier.FREE

    # Downgrade to free if subscription is not active
    if data["plan_tier"] != "free" and data.get("subscription_status") not in ("active", "trialing"):
        return PlanTier.FREE

    return data.get("plan_tier", PlanTier.FREE)


def get_current_usage(supabase: Client, user_id: str) -> dict:
    """Return current period query count for a user."""
    period = current_billing_period()
    result = (
        supabase.table("ai_usage")
        .select("query_count, token_count")
        .eq("user_id", user_id)
        .eq("period", period)
        .maybe_single()
        .execute()
    )
    data = result.data or {}
    return {
        "query_count": data.get("query_count", 0),
        "token_count":  data.get("token_count", 0),
        "period":       period,
    }


def check_quota(supabase: Client, user_id: str, feature: str) -> dict:
    """
    Check if the user is allowed to make an AI request.
    Returns quota status dict. Raises QuotaExceededError if over limit.
    """
    tier    = get_user_tier(supabase, user_id)
    config  = get_tier_config(tier)
    usage   = get_current_usage(supabase, user_id)

    if feature not in config.features:
        raise PermissionError(
            f"Feature '{feature}' is not available on the '{tier}' plan."
        )

    if config.monthly_query_limit is not None:
        if usage["query_count"] >= config.monthly_query_limit:
            raise QuotaExceededError(tier, usage["query_count"], config.monthly_query_limit)

    remaining = (
        None if config.monthly_query_limit is None
        else max(0, config.monthly_query_limit - usage["query_count"])
    )

    return {
        "tier":      tier,
        "used":      usage["query_count"],
        "limit":     config.monthly_query_limit,
        "remaining": remaining,
    }


def record_usage(supabase: Client, user_id: str, tokens: int = 0) -> None:
    """Atomically increment usage counters via the DB RPC function."""
    period = current_billing_period()
    try:
        supabase.rpc(
            "increment_ai_usage",
            {"p_user_id": user_id, "p_period": period, "p_tokens": tokens},
        ).execute()
    except Exception as e:
        # Non-fatal: log and continue
        print(f"[AI Usage] Failed to record usage: {e}", file=sys.stderr)


# ============================================================
# CLAUDE GATEWAY
# ============================================================

@dataclass
class AIMessage:
    role:    str   # "user" | "assistant"
    content: str


@dataclass
class AIResponse:
    content:       str
    model:         str
    input_tokens:  int
    output_tokens: int
    total_tokens:  int
    tier:          str
    quota:         dict


class RodStackAI:
    """
    The main AI gateway class.
    Mirrors the TypeScript completeAI() and streamAI() functions.

    Example usage:
        ai = RodStackAI()
        response = ai.complete(
            user_id="abc-123",
            feature="rod_builder_suggestions",
            messages=[AIMessage("user", "What guides for a 7ft MH blank?")],
        )
        print(response.content)
    """

    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise EnvironmentError("ANTHROPIC_API_KEY environment variable is not set.")
        self._anthropic = anthropic.Anthropic(api_key=api_key)
        self._supabase   = get_supabase()

    def complete(
        self,
        user_id:  str,
        feature:  str,
        messages: list[AIMessage],
        build:    Optional[dict] = None,
    ) -> AIResponse:
        """Non-streaming completion — checks quota, calls Claude, records usage."""

        # 1. Quota check
        quota = check_quota(self._supabase, user_id, feature)
        config = get_tier_config(quota["tier"])

        # 2. Build system prompt
        system_prompt = build_system_prompt(build)

        # 3. Call Anthropic
        response = self._anthropic.messages.create(
            model=config.model,
            max_tokens=config.max_output_tokens,
            system=system_prompt,
            messages=[{"role": m.role, "content": m.content} for m in messages],
        )

        output_text   = "".join(b.text for b in response.content if b.type == "text")
        input_tokens  = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        total_tokens  = input_tokens + output_tokens

        # 4. Record usage
        record_usage(self._supabase, user_id, total_tokens)

        return AIResponse(
            content=output_text,
            model=config.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            tier=quota["tier"],
            quota={
                **quota,
                "used":      quota["used"] + 1,
                "remaining": None if quota["remaining"] is None else quota["remaining"] - 1,
            },
        )

    def stream(
        self,
        user_id:  str,
        feature:  str,
        messages: list[AIMessage],
        build:    Optional[dict] = None,
    ) -> Iterator[str]:
        """
        Streaming completion — yields text chunks as they arrive.
        Records usage after the stream completes.

        Example:
            for chunk in ai.stream(user_id, feature, messages):
                print(chunk, end="", flush=True)
        """
        quota  = check_quota(self._supabase, user_id, feature)
        config = get_tier_config(quota["tier"])

        if not config.streaming_enabled:
            raise PermissionError(
                f"Streaming is not available on the '{quota['tier']}' plan."
            )

        system_prompt  = build_system_prompt(build)
        total_tokens   = 0
        input_tokens   = 0
        output_tokens  = 0

        with self._anthropic.messages.stream(
            model=config.model,
            max_tokens=config.max_output_tokens,
            system=system_prompt,
            messages=[{"role": m.role, "content": m.content} for m in messages],
        ) as stream:
            for text in stream.text_stream:
                yield text

            # Capture final token counts from the completed message
            final_msg    = stream.get_final_message()
            input_tokens  = final_msg.usage.input_tokens
            output_tokens = final_msg.usage.output_tokens
            total_tokens  = input_tokens + output_tokens

        # Record after stream completes
        record_usage(self._supabase, user_id, total_tokens)


# ============================================================
# CLI INTERFACE
# Run: python ai_gateway.py <user_id> "<question>"
# ============================================================

def cli():
    import argparse

    parser = argparse.ArgumentParser(
        description="RodStack AI Gateway CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ai_gateway.py --user abc-123 --ask "What guides for a 7ft MH graphite blank?"
  python ai_gateway.py --user abc-123 --feature guide_spacing_analysis --ask "Spacing for a 7.5ft spinning rod?"
  python ai_gateway.py --user abc-123 --stream --ask "Give me a complete build critique."
        """,
    )
    parser.add_argument("--user",    required=True,  help="Supabase user ID")
    parser.add_argument("--ask",     required=True,  help="Question to ask")
    parser.add_argument("--feature", default="rod_builder_suggestions", help="AI feature")
    parser.add_argument("--stream",  action="store_true", help="Stream the response")
    parser.add_argument("--build",   type=json.loads, default=None,
                        help='JSON build context, e.g. \'{"rod_length": 7, "power": "medium"}\'')

    args = parser.parse_args()

    try:
        ai = RodStackAI()
        messages = [AIMessage(role="user", content=args.ask)]

        print(f"\n[RodStack AI] User: {args.user} | Tier: checking... | Feature: {args.feature}\n")
        print("─" * 60)

        if args.stream:
            print("STREAMING RESPONSE:\n")
            for chunk in ai.stream(args.user, args.feature, messages, args.build):
                print(chunk, end="", flush=True)
            print("\n")
        else:
            response = ai.complete(args.user, args.feature, messages, args.build)
            print(f"RESPONSE ({response.tier} plan | {response.total_tokens} tokens):\n")
            print(response.content)
            print(f"\n─ Quota: {response.quota['used']}/{response.quota['limit'] or '∞'} queries used ─")

    except QuotaExceededError as e:
        print(f"\n[QUOTA EXCEEDED] {e}", file=sys.stderr)
        sys.exit(1)
    except PermissionError as e:
        print(f"\n[FEATURE LOCKED] {e}", file=sys.stderr)
        sys.exit(1)
    except EnvironmentError as e:
        print(f"\n[CONFIG ERROR] {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    cli()
