# app-pwa

Monorepo: `pwa-app/` (Angular 21 PWA + SSR) + `backend/` (NestJS + PostgreSQL + WebAuthn).

## Quick start

```bash
# Backend (terminal 1)
cd backend
npm start          # ts-node src/main.ts → :3000

# Frontend dev (terminal 2)
cd pwa-app
npm start          # ng serve → :4200, proxy /api → :3000

# Frontend dev accessible on LAN (e.g. mobile testing)
npm run start:network   # --host 0.0.0.0 --port 4200

# Frontend production SSR
npm run build
npm run serve:ssr:pwa-app  # → :4000
```

## Architecture

- **All backend endpoints** under `/api/*` (global prefix set in `backend/src/main.ts`)
- **Dev proxy** via `proxy.conf.json` — `/api` → `localhost:3000`
- **Prod SSR proxy** in `server.ts` — Express middleware with `pathRewrite: { '^/': '/api/' }` (Express strips `/api` prefix, must re-add)
- **No CORS in production** — SSR proxy and browser share same origin
- **DB**: PostgreSQL, credentials via `.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), `synchronize: true` (dev only)
- **Challenges**: in-memory Map (lost on backend restart)

## WebAuthn

- `rpID` and `expectedOrigin` resolved **dynamically from request `Origin` header** (`passkeys.service.ts:28-37`). Falls back to env vars `RP_ID` / `EXPECTED_ORIGIN`, then to `localhost` / `http://localhost:4200`
- Passkey login and registration `begin`+`complete` endpoints accept optional `origin` param from `@Headers('origin')`
- `localhost` and local network IPs work without HTTPS in Chrome

## Backend

| Command | Description |
|---------|-------------|
| `npm start` | `ts-node src/main.ts` (port 3000) |
| `npm run build` | `tsc` → `dist/` |
| `npm run reset-tokens` | Limpia `microsoftRefreshToken` de todos los usuarios en BD |
| No test script | |

- NestJS 11, TypeORM, `bcrypt`, `@nestjs/jwt`, `@simplewebauthn/server`
- `tsconfig.json`: `target: ES2021`, `module: commonjs`, `experimentalDecorators`, `emitDecoratorMetadata`
- `app.enableCors()` in `main.ts`
- JWT secret: `process.env.JWT_SECRET ?? 'dev-secret-change-in-production'`
- Challenge storage: two `Map`s — `challenges` (keyed by userId) and `loginChallenges` (keyed by crypto.randomUUID sessionId)

## Frontend

See `pwa-app/AGENTS.md` for full conventions. Key points:

| Command | Description |
|---------|-------------|
| `npm start` | `ng serve` → :4200 |
| `npm test` | Vitest via `@angular/build:unit-test` |
| `npm run build` | Production build to `dist/` |
| `npm run serve:ssr:pwa-app` | SSR Express on :4000 |

- **Standalone** components, **Signals**, new control flow, SSR with prerender by default
- **SW only in production** (`!isDevMode()`), registered after 30s stable
- **No ESLint** — only Prettier (`npx prettier --write .`)
- **TypeScript**: `strict`, `strictTemplates`, `isolatedModules`
- **Vitest + jsdom**: `describe`/`it`/`expect` globals, test files `src/**/*.spec.ts`

### Auth flow

- `AuthService.init()` runs in root `App` constructor, guarded by `isPlatformBrowser()` (SSR-safe)
- JWT stored in `IndexedDB` (not localStorage — avoids SW cache contamination)
- `authInterceptor` sets `Authorization: Bearer` header, skips paths containing `/auth/login` or `/auth/passkey/login`
- `authGuard` redirects to `/login` if not authenticated
- Login/register redirect to `/profile`

## Testing on Android from PC

```bash
# 1. Get local IP
ip a | grep -oP 'inet \K192\.168\.\d+\.\d+'

# 2. Backend with correct WebAuthn origin
RP_ID=192.168.1.X EXPECTED_ORIGIN=http://192.168.1.X:4200 npx ts-node src/main.ts

# 3. Frontend accessible on network
npm run start:network
```

For HTTPS (PWA install, ngrok tunnel): build → SSR → `ngrok http 4000`.


Codigo de ejemplo:
```python
import asyncio
import logging
import logging.handlers
import os
import sys
import time
import traceback
from functools import wraps

import msal
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session, redirect, url_for
from flask_session import Session
from microsoft_agents.activity import Activity, ActivityTypes
from microsoft_agents.copilotstudio.client import (
    ConnectionSettings,
    CopilotClient,
    PowerPlatformCloud,
    AgentType,
)

logger = logging.getLogger(__name__)

# ── File logging (always on) ──────────────────────────────────────────────
_log_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s.%(funcName)s:%(lineno)d: %(message)s"
)
_log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs", "app.log")
os.makedirs(os.path.dirname(_log_file), exist_ok=True)
_file_handler = logging.handlers.RotatingFileHandler(
    _log_file, maxBytes=5_242_880, backupCount=3, encoding="utf-8"
)
_file_handler.setFormatter(_log_formatter)
_file_handler.setLevel(logging.DEBUG)

# ── Console handler (always on) ──────────────────────────────────────────
_console_handler = logging.StreamHandler()
_console_handler.setFormatter(_log_formatter)
_console_handler.setLevel(logging.DEBUG)

# ── Root logger: enable everything, propagate ────────────────────────────
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s.%(funcName)s:%(lineno)d: %(message)s",
    handlers=[_file_handler, _console_handler],
    force=True,
)

# ── Verbose logs for SDKs (inherit handlers from root via propagation) ────
for lib in ("microsoft_agents", "msal", "aiohttp"):
    logging.getLogger(lib).setLevel(logging.DEBUG)

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ["FLASK_SECRET_KEY"]
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
Session(app)

logger.info("=" * 60)
logger.info("APP STARTUP — ELENA-Web")
logger.info("=" * 60)
logger.info("Log file: %s", _log_file)
logger.info("=" * 60)


# ── Log every HTTP request ────────────────────────────────────────────────
@app.before_request
def _log_request():
    logger.debug(">>> %s %s from=%s len=%s",
                 request.method, request.path, request.remote_addr,
                 request.content_length or "-")


@app.after_request
def _log_response(response):
    logger.debug("<<< %s %s -> %s", request.method, request.path, response.status_code)
    return response


@app.teardown_request
def _log_teardown(exc):
    if exc:
        logger.error("TEARDOWN %s %s: %s", request.method, request.path, exc)

AZURE_CLIENT_ID = os.environ["AZURE_CLIENT_ID"]
AZURE_CLIENT_SECRET = os.environ["AZURE_CLIENT_SECRET"]
AZURE_TENANT_ID = os.environ["AZURE_TENANT_ID"]
AZURE_AUTHORITY = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}"
AZURE_REDIRECT_URI = os.environ["AZURE_REDIRECT_URI"]
SCOPE = ["https://api.powerplatform.com/.default"]

CS_ENVIRONMENT_ID = os.environ["COPILOTSTUDIOAGENT__ENVIRONMENTID"]
CS_SCHEMA_NAME = os.environ["COPILOTSTUDIOAGENT__SCHEMANAME"]
CS_TENANT_ID = os.environ.get("COPILOTSTUDIOAGENT__TENANTID", AZURE_TENANT_ID)
CS_CLIENT_ID = os.environ.get("COPILOTSTUDIOAGENT__AGENTAPPID", AZURE_CLIENT_ID)

logger.info("AZURE_AUTHORITY=%s", AZURE_AUTHORITY)
logger.info("AZURE_REDIRECT_URI=%s", AZURE_REDIRECT_URI)
logger.info("SCOPE=%s", SCOPE)
logger.info("CS_ENVIRONMENT_ID=%s", CS_ENVIRONMENT_ID)
logger.info("CS_SCHEMA_NAME=%s", CS_SCHEMA_NAME)
logger.info("CS_TENANT_ID=%s (fallback=%s)", CS_TENANT_ID, CS_TENANT_ID == AZURE_TENANT_ID)
logger.info("CS_CLIENT_ID=%s (fallback=%s)", CS_CLIENT_ID, CS_CLIENT_ID == AZURE_CLIENT_ID)

sessions = {}
rate_store = {}
RATE_CONFIG = {
    "/api/chat/session": (10, 60),
    "/api/chat/message": (30, 60),
    "/api/chat/end": (10, 60),
}


def rate_limit(endpoint):
    max_r, window = RATE_CONFIG.get(endpoint, (30, 60))

    def dec(f):
        @wraps(f)
        def wrapper(*args, **kw):
            now = time.time()
            ip = request.remote_addr or "unknown"
            key = f"{endpoint}:{ip}"
            if key not in rate_store:
                rate_store[key] = []
            rate_store[key] = [t for t in rate_store[key] if now - t < window]
            if len(rate_store[key]) >= max_r:
                logger.warning("rate_limit exceeded endpoint=%s ip=%s count=%d", endpoint, ip, len(rate_store[key]))
                return jsonify({"error": "rate_limit"}), 429
            rate_store[key].append(now)
            return f(*args, **kw)

        return wrapper

    return dec


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kw):
        if "user" not in session:
            logger.info("login_required denied: path=%s ip=%s", request.path, request.remote_addr)
            if request.path.startswith("/api/"):
                return jsonify({"error": "unauthorized"}), 401
            return redirect(url_for("login"))
        return f(*args, **kw)

    return wrapper


def _get_msal_app():
    return msal.ConfidentialClientApplication(
        client_id=AZURE_CLIENT_ID,
        client_credential=AZURE_CLIENT_SECRET,
        authority=AZURE_AUTHORITY,
    )


def _get_token():
    logger.debug("_get_token: ENTER")

    cache = msal.SerializableTokenCache()
    if "token_cache" in session:
        cache.deserialize(session["token_cache"])
        logger.debug("_get_token: token_cache deserialized (%d bytes)", len(session["token_cache"]))
    else:
        logger.debug("_get_token: no token_cache in session")

    logger.debug("_get_token: creating ConfidentialClientApplication client_id=%s authority=%s",
                 AZURE_CLIENT_ID, AZURE_AUTHORITY)
    app = msal.ConfidentialClientApplication(
        client_id=AZURE_CLIENT_ID,
        client_credential=AZURE_CLIENT_SECRET,
        authority=AZURE_AUTHORITY,
        token_cache=cache,
    )

    accounts = app.get_accounts()
    logger.debug("_get_token: get_accounts returned %d account(s)", len(accounts))
    if not accounts:
        logger.warning("_get_token: no accounts in cache, user must re-authenticate")
        return None

    # Attempt 1: silent acquisition from cache
    logger.debug("_get_token: attempt 1 — acquire_token_silent (cache only)")
    result = app.acquire_token_silent(SCOPE, account=accounts[0])
    if result and "access_token" in result:
        session["token_cache"] = cache.serialize()
        token_preview = result["access_token"][:20]
        logger.debug("_get_token: attempt 1 SUCCESS token=%s... expires_in=%s",
                     token_preview, result.get("expires_in", "?"))
        return result["access_token"]

    logger.info("_get_token: attempt 1 failed (error=%s), trying force_refresh",
                result.get("error", "unknown") if result else "no_response")

    # Attempt 2: force refresh
    logger.debug("_get_token: attempt 2 — acquire_token_silent (force_refresh=True)")
    result = app.acquire_token_silent(SCOPE, account=accounts[0], force_refresh=True)
    if result and "access_token" in result:
        session["token_cache"] = cache.serialize()
        token_preview = result["access_token"][:20]
        logger.info("_get_token: attempt 2 SUCCESS (force_refresh) token=%s... expires_in=%s",
                    token_preview, result.get("expires_in", "?"))
        return result["access_token"]

    logger.error("_get_token: all attempts exhausted. error=%s description=%s",
                 result.get("error", "unknown") if result else "N/A",
                 result.get("error_description", "") if result else "MSAL returned None")
    return None


def _get_copilot_client():
    logger.debug("_get_copilot_client: ENTER")
    token = _get_token()
    if not token:
        logger.warning("_get_copilot_client: _get_token returned None")
        return None

    logger.debug("_get_copilot_client: token acquired (len=%d, preview=%s...)",
                 len(token), token[:20])
    logger.debug("_get_copilot_client: creating ConnectionSettings env=%s schema=%s cloud=PROD agent_type=PUBLISHED use_experimental=True",
                 CS_ENVIRONMENT_ID, CS_SCHEMA_NAME)
    settings = ConnectionSettings(
        environment_id=CS_ENVIRONMENT_ID,
        agent_identifier=CS_SCHEMA_NAME,
        cloud=PowerPlatformCloud.PROD,
        copilot_agent_type=AgentType.PUBLISHED,
        use_experimental_endpoint=True,
        enable_diagnostics=True,
    )
    client = CopilotClient(settings, token)
    logger.debug("_get_copilot_client: CopilotClient created successfully")
    return client


def _find_submit_actions(content: dict) -> list[dict]:
    """Extrae todas las Action.Submit de un AdaptiveCard content."""
    actions = []
    body = content.get("body", [])
    for item in body:
        if item.get("type") == "ActionSet":
            actions.extend(item.get("actions", []))
        elif item.get("type") == "ColumnSet":
            for col in item.get("columns", []):
                for sub in col.get("items", []):
                    if sub.get("type") == "ActionSet":
                        actions.extend(sub.get("actions", []))
    return [a for a in actions if a.get("type") == "Action.Submit"]


@app.route("/auth/login")
def login():
    if "user" in session:
        logger.debug("login: already authenticated, redirecting to index")
        return redirect(url_for("index"))
    logger.info("login: redirecting to Azure AD ip=%s", request.remote_addr)
    auth_url = _get_msal_app().get_authorization_request_url(
        SCOPE, redirect_uri=AZURE_REDIRECT_URI,
    )
    return redirect(auth_url)


@app.route("/auth/callback")
def callback():
    error = request.args.get("error")
    error_desc = request.args.get("error_description")
    logger.error("callback error=%s description=%s args=%s", error, error_desc, request.args)
    code = request.args.get("code")
    if error:
        return f"Error de Azure AD: {error}<br>{error_desc}", 400
    if not code:
        return "Authorization failed: no code", 400

    logger.debug("callback: exchanging authorization code for token code_len=%d", len(code))

    cache = msal.SerializableTokenCache()
    if "token_cache" in session:
        cache.deserialize(session["token_cache"])
        logger.debug("callback: existing token_cache found in session")

    msal_app = msal.ConfidentialClientApplication(
        client_id=AZURE_CLIENT_ID,
        client_credential=AZURE_CLIENT_SECRET,
        authority=AZURE_AUTHORITY,
        token_cache=cache,
    )

    result = msal_app.acquire_token_by_authorization_code(
        code, scopes=SCOPE, redirect_uri=AZURE_REDIRECT_URI,
    )

    if "error" in result:
        logger.error("auth error: %s", result.get("error_description", result["error"]))
        return "Authentication failed", 400

    session["token_cache"] = cache.serialize()
    logger.debug("callback: token cache serialized to session (%d bytes)", len(session["token_cache"]))

    id_claims = result.get("id_token_claims", {})
    session["user"] = {
        "name": id_claims.get("name", "User"),
        "email": id_claims.get("preferred_username", id_claims.get("email", "")),
        "oid": id_claims.get("oid", ""),
    }
    logger.info("User authenticated: name=%s email=%s oid=%s",
                session["user"]["name"], session["user"]["email"], session["user"]["oid"])

    return redirect(url_for("index"))


@app.route("/auth/logout", methods=["POST"])
def logout():
    user = session.get("user", {})
    logger.info("logout: user=%s", user.get("email", "unknown"))
    session.clear()
    return jsonify({"ok": True})


@app.route("/auth/me")
def auth_me():
    if "user" not in session:
        logger.debug("auth_me: no user in session")
        return jsonify({"error": "unauthorized"}), 401
    logger.debug("auth_me: user=%s", session["user"].get("email"))
    return jsonify({"user": session["user"]})


@app.route("/api/chat/session", methods=["POST"])
@login_required
@rate_limit("/api/chat/session")
def create_session():
    user_email = session["user"]["email"]
    logger.info("create_session: user=%s", user_email)

    client = _get_copilot_client()
    if not client:
        logger.warning("create_session: auth_expired for user=%s", user_email)
        return jsonify({"error": "auth_expired"}), 401

    async def _start():
        act = client.start_conversation(True)
        conv_id = None
        welcome = None
        activity_count = 0
        async for a in act:
            activity_count += 1
            logger.info("start_conversation -> activity[%d]: type=%s text=%r conv=%s "
                         "suggested_actions=%s channel_data=%s",
                         activity_count, a.type, a.text,
                         a.conversation.id if a.conversation else None,
                         [x.title for x in a.suggested_actions.actions] if a.suggested_actions else None,
                         a.channel_data)
            if conv_id is None and a.conversation:
                conv_id = a.conversation.id
            if a.type == ActivityTypes.message and a.text:
                welcome = a.text
                if conv_id:
                    break
        logger.info("start_conversation: done, %d activities, conv_id=%s welcome=%r",
                    activity_count, conv_id, welcome)
        return conv_id, welcome

    try:
        conv_id, welcome = asyncio.run(_start())
    except Exception as e:
        logger.error("create_session: start_conversation failed for user=%s: %s", user_email, e, exc_info=True)
        return jsonify({"error": "upstream_error"}), 502

    if not conv_id:
        logger.error("create_session: no conversation_id returned for user=%s", user_email)
        return jsonify({"error": "conversation_start_failed"}), 502

    sessions[conv_id] = {
        "conversation_id": conv_id,
        "user_id": user_email,
        "created_at": time.time(),
    }
    logger.info("create_session: session created conv=%s user=%s", conv_id, user_email)
    return jsonify({
        "session_id": conv_id,
        "welcome": welcome or "\u00a1Hola! \u00bfEn qu\u00e9 puedo ayudarte?",
    })


@app.route("/api/chat/message", methods=["POST"])
@login_required
@rate_limit("/api/chat/message")
def send_message():
    user_email = session["user"]["email"]
    body = request.get_json(silent=True) or {}
    sid = body.get("session_id")
    text = (body.get("text") or "").strip()

    if not sid or not text:
        return jsonify({"error": "missing_fields"}), 400
    if len(text) > 2000:
        return jsonify({"error": "text_too_long"}), 400
    if sid not in sessions:
        logger.warning("send_message: session_not_found sid=%s user=%s", sid, user_email)
        return jsonify({"error": "session_not_found"}), 404

    client = _get_copilot_client()
    if not client:
        return jsonify({"error": "auth_expired"}), 401

    logger.info("send_message: sid=%s user=%s text_len=%d text_preview=%s",
                sid, user_email, len(text), text[:80])

    async def _wait_for_subscribe_reply(conv_id: str):
        """POST to /subscribe with empty body (matching .NET SDK) to wait for plan completion."""
        from microsoft_agents.copilotstudio.client import PowerPlatformEnvironment

        url = PowerPlatformEnvironment.get_copilot_studio_connection_url(
            client.settings, conv_id, create_subscribe_link=True)
        logger.info("subscribe POST to %s", url)

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {client._token}",
            "Accept": "text/event-stream",
        }
        try:
            async for activity in client.post_request(url, {}, headers):
                logger.info("subscribe POST -> activity: type=%s text=%r name=%s",
                            activity.type, activity.text, activity.name)
                if activity.type == ActivityTypes.message and activity.text:
                    return activity.text
                if activity.type == ActivityTypes.end_of_conversation:
                    logger.info("subscribe POST: end_of_conversation")
                    break
        except Exception as e:
            logger.warning("subscribe POST failed: %s; will fall back to re-ask", e)
        return None

    async def _ask():
        replies = client.ask_question(text, sid)
        reply_text = None
        streaming_text = None
        activity_count = 0
        has_plan_events = False
        async for r in replies:
            activity_count += 1
            logger.info("ask_question -> activity[%d]: type=%s text=%r "
                         "suggested_actions=%s channel_data=%s value=%s attachments=%s name=%s",
                         activity_count, r.type, r.text,
                         [x.title for x in r.suggested_actions.actions] if r.suggested_actions else None,
                         r.channel_data, r.value,
                         r.attachments, r.name)
            if r.name and "DynamicPlan" in r.name:
                has_plan_events = True
            if r.type == ActivityTypes.message and r.text:
                reply_text = r.text
            elif r.type == ActivityTypes.end_of_conversation:
                logger.info("ask_question: end_of_conversation code=%s", getattr(r, "code", None))
                break
            elif r.type == ActivityTypes.typing and r.text:
                cd = r.channel_data or {}
                if isinstance(cd, dict) and cd.get("streamType") == "streaming" and cd.get("chunkType") == "delta":
                    streaming_text = (streaming_text or "") + r.text
                    logger.debug("ask_question: streaming chunk seq=%s total_len=%d",
                                 cd.get("streamSequence"), len(streaming_text))
            elif r.type == ActivityTypes.message and r.attachments:
                for att in r.attachments:
                    if att.content_type != "application/vnd.microsoft.card.adaptive":
                        continue
                    submit_actions = _find_submit_actions(att.content)
                    titles = [a.get("title", "") for a in submit_actions]
                    logger.info("ask_question: detected adaptive card, submit_actions=%s", titles)
                    if any(t in ("Permitir", "Allow") for t in titles):
                        logger.info("ask_question: consent card detected, auto-sending Allow")
                        consent_activity = Activity(
                            type=ActivityTypes.message,
                            value={"action": "Allow", "id": "submit", "shouldAwaitUserInput": True},
                        )
                        consent_replies = client.execute(sid, consent_activity)
                        async for cr in consent_replies:
                            if cr.type == ActivityTypes.message and cr.text:
                                reply_text = cr.text
                                logger.info("ask_question: consent response=%r", reply_text)
                            elif cr.type == ActivityTypes.end_of_conversation:
                                logger.info("ask_question: consent end_of_conversation")
                                break
                    else:
                        body = att.content.get("body", [])
                        card_text = "\n".join(
                            b["text"] for b in body
                            if b.get("type") == "TextBlock" and b.get("text")
                        )
                        logger.info("ask_question: non-consent card, extracting text")
                        reply_text = card_text
        final_reply = streaming_text or reply_text
        logger.info("ask_question: done, %d activities, streaming=%r reply=%r final=%r has_plan_events=%s",
                    activity_count, streaming_text, reply_text, final_reply, has_plan_events)
        if not final_reply and has_plan_events and sid:
            logger.info("ask_question: plan did not complete in stream; subscribing (timeout=600s)")
            try:
                sub_reply = await asyncio.wait_for(
                    _wait_for_subscribe_reply(sid),
                    timeout=600.0,
                )
                if sub_reply:
                    logger.info("ask_question: subscribe got reply=%r", sub_reply)
                    final_reply = sub_reply
            except asyncio.TimeoutError:
                logger.warning("ask_question: subscribe timed out after 600s")
            except Exception as e:
                logger.warning("ask_question: subscribe failed (%s); will re-ask after delay", e)

            if not final_reply:
                logger.info("ask_question: re-asking after 5s delay (plan may have completed)")
                await asyncio.sleep(5)
                try:
                    retry_replies = client.ask_question(text, sid)
                    async for r in retry_replies:
                        if r.type == ActivityTypes.message and r.text:
                            final_reply = r.text
                            logger.info("ask_question: re-ask got reply=%r", final_reply)
                            break
                except Exception as e2:
                    logger.error("ask_question: re-ask also failed: %s", e2, exc_info=True)
        return final_reply

    try:
        reply = asyncio.run(_ask())
        logger.debug("send_message: reply received sid=%s len=%d preview=%s",
                     sid, len(reply or ""), (reply or "")[:80])
        return jsonify({"reply": reply or ""})
    except Exception as e:
        logger.error("send_message: ask_question failed sid=%s user=%s: %s", sid, user_email, e, exc_info=True)
        return jsonify({"error": "send_failed"}), 502


@app.route("/api/chat/end", methods=["POST"])
@login_required
@rate_limit("/api/chat/end")
def end_session():
    user_email = session["user"]["email"]
    body = request.get_json(silent=True) or {}
    sid = body.get("session_id")
    if sid:
        if sid in sessions:
            del sessions[sid]
            logger.info("end_session: session ended conv=%s user=%s", sid, user_email)
        else:
            logger.warning("end_session: session not found conv=%s user=%s", sid, user_email)
    return jsonify({"ok": True})


@app.route("/")
@login_required
def index():
    logger.debug("index: rendering page for user=%s", session.get("user", {}).get("email"))
    return render_template("index.html", user=session.get("user"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8002)

```