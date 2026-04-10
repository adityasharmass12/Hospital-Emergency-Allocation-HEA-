"""
HEA — Hospital Emergency Allocation
LangChain-powered Chatbot with hospital-specific tools and conversation memory.
Supports two personas: admin (HEA-GPT) and patient (Aura).

LLM Priority (unlimited first):
  1. Ollama (local, free, unlimited) — set OLLAMA_MODEL in .env
  2. Groq (cloud, rate-limited) — set GROQ_API_KEY in .env
  3. Fallback (rule-based, no AI)
"""
import os
import sqlite3
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# ── LangChain Agent Imports ─────────────────────────────────────────────
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import Tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory

# ── LLM Setup (priority: Ollama > Groq > None) ─────────────────────────
llm = None
llm_provider = "none"  # 'ollama', 'groq', or 'none'

# 1) Try Ollama first — local, unlimited, no API key needed
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.3")
try:
    from langchain_ollama import ChatOllama
    test_llm = ChatOllama(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL,
        temperature=0.7,
        keep_alive="5m",
    )
    # Quick connectivity check — don't fail import if Ollama isn't running
    try:
        test_llm.invoke("hello")
        llm = test_llm
        llm_provider = "ollama"
    except Exception:
        pass
except ImportError:
    pass

# 2) Fall back to Groq if Ollama unavailable and Groq key exists
if llm is None and os.getenv("GROQ_API_KEY"):
    try:
        from langchain_groq import ChatGroq
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.7,
        )
        llm_provider = "groq"
    except ImportError:
        pass


# ── Database Helpers ──────────────────────────────────────────────────
def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'hea.db')
    return sqlite3.connect(db_path)


def get_db_stats() -> dict:
    """Fetches real-time hospital statistics for tool context."""
    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row

        beds = conn.execute(
            "SELECT ward, status, COUNT(*) as count FROM beds GROUP BY ward, status"
        ).fetchall()
        bed_str = ", ".join([f"{b['ward']} ({b['status']}): {b['count']}" for b in beds])

        patients = conn.execute(
            "SELECT COUNT(*) as count FROM patients WHERE discharged_at IS NULL"
        ).fetchone()
        patient_count = patients["count"] if patients else 0

        staff = conn.execute(
            "SELECT role, COUNT(*) as count FROM staff WHERE on_duty=1 GROUP BY role"
        ).fetchall()
        staff_str = ", ".join([f"{s['role']}s: {s['count']}" for s in staff])

        conn.close()
        return {"beds": bed_str, "patients": patient_count, "staff": staff_str}
    except Exception as e:
        return {"beds": "Unknown", "patients": 0, "staff": "Unknown", "error": str(e)}


def get_bed_availability(ward: Optional[str] = None) -> str:
    """Returns available beds, optionally filtered by ward."""
    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        if ward:
            rows = conn.execute(
                "SELECT bed_number, ward FROM beds WHERE status='available' AND ward=?",
                (ward,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT bed_number, ward FROM beds WHERE status='available'"
            ).fetchall()
        conn.close()
        if not rows:
            return "No available beds found."
        return ", ".join([f"Bed {r['bed_number']} ({r['ward']})" for r in rows])
    except Exception as e:
        return f"Error fetching beds: {e}"


def get_patient_summary() -> str:
    """Returns a summary of active patients."""
    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        patients = conn.execute(
            "SELECT name, condition, priority, ward FROM patients WHERE discharged_at IS NULL LIMIT 20"
        ).fetchall()
        conn.close()
        if not patients:
            return "No active patients."
        lines = [f"{p['name']} | {p['condition']} | {p['priority']} | Ward: {p['ward'] or 'N/A'}"
                 for p in patients]
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching patients: {e}"


def get_staff_schedule() -> str:
    """Returns on-duty staff summary."""
    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        staff = conn.execute(
            "SELECT name, role, ward, shift FROM staff WHERE on_duty=1"
        ).fetchall()
        conn.close()
        if not staff:
            return "No staff currently on duty."
        lines = [f"{s['name']} | {s['role']} | {s['ward']} | Shift: {s['shift']}"
                  for s in staff]
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching staff: {e}"


def get_occupancy_rate() -> str:
    """Returns overall hospital occupancy rate."""
    try:
        conn = get_db_connection()
        total = conn.execute("SELECT COUNT(*) FROM beds").fetchone()[0]
        occupied = conn.execute("SELECT COUNT(*) FROM beds WHERE status='occupied'").fetchone()[0]
        conn.close()
        if total == 0:
            return "No beds configured."
        rate = round((occupied / total) * 100, 1)
        return f"Occupancy: {occupied}/{total} beds ({rate}%)"
    except Exception as e:
        return f"Error: {e}"


def get_forecast_summary() -> str:
    """Returns the 72-hour admission forecast."""
    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT day, predicted_admissions, predicted_emergency, predicted_icu, surge_alert "
            "FROM forecast_results ORDER BY date ASC LIMIT 3"
        ).fetchall()
        conn.close()
        if not rows:
            return "No forecast data available."
        lines = []
        for r in rows:
            alert = "⚠️ SURGE" if r["surge_alert"] else ""
            lines.append(
                f"{r['day']}: {r['predicted_admissions']} admissions, "
                f"{r['predicted_emergency']} emergency, {r['predicted_icu']} ICU {alert}"
            )
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching forecast: {e}"


# ── Tool Definitions ───────────────────────────────────────────────────
tools = [
    Tool(
        name="get_db_stats",
        func=lambda _: str(get_db_stats()),
        description=(
            "Returns real-time hospital statistics including bed breakdown by ward/status, "
            "active patient count, and on-duty personnel by role. "
            "Use this for any query about current hospital operational status."
        ),
    ),
    Tool(
        name="get_bed_availability",
        func=lambda ward: get_bed_availability(ward if ward and ward.strip() else None),
        description=(
            "Returns a list of all currently available (free) beds. "
            "Pass a ward name as argument to filter by specific ward. "
            "Example input: 'Emergency' or 'ICU' or 'General'."
        ),
    ),
    Tool(
        name="get_patient_summary",
        func=lambda _: get_patient_summary(),
        description="Returns a summary of up to 20 currently active (non-discharged) patients with their name, condition, priority, and ward.",
    ),
    Tool(
        name="get_staff_schedule",
        func=lambda _: get_staff_schedule(),
        description="Returns the list of currently on-duty staff members with their name, role, ward, and shift.",
    ),
    Tool(
        name="get_occupancy_rate",
        func=lambda _: get_occupancy_rate(),
        description="Returns the overall hospital bed occupancy percentage and counts.",
    ),
    Tool(
        name="get_forecast_summary",
        func=lambda _: get_forecast_summary(),
        description="Returns a 3-day admission forecast including predicted totals, emergency, and ICU numbers.",
    ),
]


# ── Persona Prompts ────────────────────────────────────────────────────
PERSONA_PROMPTS = {
    "admin": """You are HEA-GPT, an AI assistant for hospital administrators at the Hospital Emergency Allocation (HEA) system.

Your role is to help admins manage hospital operations efficiently. You have access to real-time hospital data through tools.

TOOLS AVAILABLE:
- get_db_stats: Real-time hospital statistics (beds, patients, staff)
- get_bed_availability: List of free beds (optionally by ward)
- get_patient_summary: Active patients with conditions
- get_staff_schedule: On-duty staff roster
- get_occupancy_rate: Overall bed occupancy percentage
- get_forecast_summary: 3-day admission predictions

GUIDELINES:
- Always use tools when the query asks about beds, patients, staff, capacity, or forecasts
- Be concise and professional in your responses
- Format data clearly with bullet points or tables when helpful
- If asked to perform actions (admit patient, allocate bed), explain the process using the dashboard
- If a tool returns an error, acknowledge it and offer next steps
- When presenting forecasts, mention any surge alerts
""",
    "patient": """You are Aura, a compassionate AI health assistant for patients using the Hospital Emergency Allocation (HEA) system.

Your role is to help patients find hospitals, understand bed availability, and navigate emergency services.

AVAILABLE DATA (via tools):
- get_db_stats: Overall hospital bed availability
- get_bed_availability: Free beds at nearby hospitals
- get_occupancy_rate: How busy the hospital is

GUIDELINES:
- Be warm, clear, and reassuring — patients may be in distress
- Guide patients step-by-step through finding care
- For emergencies, always recommend calling emergency services first
- Explain bed availability in simple, non-technical terms
- When hospital is busy (high occupancy), suggest alternatives or waiting times
- Never provide medical diagnoses — suggest consulting a doctor
""",
    "staff": """You are MediAssist, an AI assistant for hospital staff at the Hospital Emergency Allocation (HEA) system.

Your role is to help nurses, doctors, and hospital staff manage patient care, scheduling, and ward operations.

TOOLS AVAILABLE:
- get_db_stats: Real-time hospital statistics (beds, patients, staff)
- get_bed_availability: Available beds by ward for patient placement
- get_patient_summary: Active patient conditions and priority levels
- get_staff_schedule: Current shift roster and on-duty status
- get_occupancy_rate: Current ward occupancy percentage
- get_forecast_summary: Admission predictions for shift planning

GUIDELINES:
- Be professional and supportive of clinical staff
- Provide quick access to patient loads, bed availability, and scheduling
- Help with shift planning and resource allocation
- When queried about patients, provide relevant ward/bed information
- Support critical decision-making with real-time data
- Acknowledge fatigue and workload — offer resource suggestions when busy
- For complex medical queries, defer to consulting physicians
""",
}


# ── In-Memory Chat History Store ──────────────────────────────────────
store: dict[str, ChatMessageHistory] = {}


def get_session_history(session_id: str) -> ChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]


# ── Agent Factory ─────────────────────────────────────────────────────
def create_chat_agent(user_context: str = "admin"):
    persona = PERSONA_PROMPTS.get(user_context, PERSONA_PROMPTS["admin"])

    if llm is None:
        return None

    # Try tool-calling agent first (Groq + Ollama with tool support)
    try:
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=persona),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        agent = create_tool_calling_agent(llm, tools, prompt)
        executor = AgentExecutor(agent=agent, tools=tools, verbose=False, handle_parsing_errors=True)
        return RunnableWithMessageHistory(
            executor,
            get_session_history,
            input_messages_key="input",
            history_messages_key="chat_history",
        )
    except Exception:
        # Ollama models that don't support tool calling — use completion-based agent
        pass

    # Fallback: use a simple completion prompt with injected real-time context
    def completion_agent(query: str, session_id: str) -> str:
        stats = get_db_stats()
        history = get_session_history(session_id)
        history_msgs = history.messages[-6:]  # last 3 exchanges

        # Inject tool results into context
        context_lines = [
            f"Current hospital data:",
            f"  Beds by ward/status: {stats.get('beds', 'Unknown')}",
            f"  Active patients: {stats.get('patients', 0)}",
            f"  On-duty staff: {stats.get('staff', 'Unknown')}",
            f"  Occupancy: {get_occupancy_rate()}",
            f"  3-day forecast: {get_forecast_summary()}",
        ]

        # Build conversation history string
        conv_history = ""
        for msg in history_msgs:
            if hasattr(msg, "type") and msg.type == "human":
                conv_history += f"User: {msg.content}\n"
            elif hasattr(msg, "type") and msg.type == "ai":
                conv_history += f"Assistant: {msg.content}\n"

        full_prompt = f"""{persona}

CURRENT REAL-TIME DATA:
{chr(10).join(context_lines)}

CONVERSATION HISTORY (recent):
{conv_history}

User's new question: {query}

Answer based on the current real-time data above. Keep it concise and professional.
If you need specific data not provided, use the available information above to give your best answer."""

        try:
            response = llm.invoke(full_prompt)
            content = response.content if hasattr(response, "content") else str(response)
            # Save to history
            history.add_user_message(query)
            history.add_ai_message(content)
            return content
        except Exception as e:
            return f"AI error: {e}"

    return completion_agent


# ── Fallback (no API key) ─────────────────────────────────────────────
def fallback_response(query: str, user_context: str, stats: dict) -> str:
    """Rule-based fallback when no LLM (Ollama or Groq) is available."""
    q = query.lower()
    
    # Determine assistant name based on context
    if user_context == "admin":
        assistant_name = "HEA-GPT"
    elif user_context == "staff":
        assistant_name = "MediAssist"
    else:
        assistant_name = "Aura"

    if any(w in q for w in ["bed", "capacity", "available", "empty", "free", "ward"]):
        beds_info = stats.get("beds", "No data")
        return (f"Based on current hospital data:\n"
                f"• Bed breakdown: {beds_info}\n"
                f"• Active patients: {stats.get('patients', 0)}\n"
                f"• On-duty staff: {stats.get('staff', 'Unknown')}")

    if any(w in q for w in ["staff", "doctor", "nurse", "duty", "personnel", "schedule", "roster"]):
        staff_info = stats.get("staff", "No data")
        return f"Currently on-duty personnel: {staff_info}"

    if any(w in q for w in ["occupancy", "full", "busy", "usage", "congestion"]):
        occ = get_occupancy_rate()
        return f"Hospital occupancy status:\n{occ}"

    if any(w in q for w in ["forecast", "prediction", "upcoming", "next", "admission"]):
        fc = get_forecast_summary()
        return f"72-Hour Admission Forecast:\n{fc}"

    if any(w in q for w in ["patient", "admitted", "cases", "active"]):
        pat = get_patient_summary()
        return f"Active patients:\n{pat}"

    if any(w in q for w in ["hello", "hi", "hey", "who are you", "what can you do"]):
        if user_context == "admin":
            return (f"Hello! I'm {assistant_name}, your hospital operations assistant. "
                    f"I can help with bed availability, staff schedules, patient information, "
                    f"occupancy rates, and admission forecasts. What would you like to know?")
        elif user_context == "staff":
            return (f"Hello! I'm {assistant_name}, your clinical support assistant. "
                    f"I can help you with bed availability, patient loads, schedule info, "
                    f"and resource availability. How can I assist you?")
        else:
            return (f"Hello! I'm {assistant_name}, your health assistant. "
                    f"I can help you find hospital beds and understand emergency services. What do you need?")

    return (f"I can provide real-time hospital information:\n"
            f"• Beds: {stats.get('beds', 'Unknown')}\n"
            f"• Patients: {stats.get('patients', 0)}\n"
            f"• Staff: {stats.get('staff', 'Unknown')}\n\n"
            f"Try asking me about:\n"
            f"- Available beds and capacity\n"
            f"- Staff schedules and shift information\n"
            f"- Occupancy rates\n"
            f"- Admission forecasts")


# ── Main Entry Point ───────────────────────────────────────────────────
def process_chat(query: str, user_context: str = "admin", session_id: str = "default") -> str:
    """
    Main entry point for chatbot logic.
    Priority: Ollama (unlimited) > Groq (rate-limited) > Rule-based fallback.
    """
    try:
        # Get fallback stats early in case we need them
        stats = get_db_stats()
        
        agent = create_chat_agent(user_context)

        if agent is not None:
            try:
                # Tool-calling agent (Groq)
                if hasattr(agent, "invoke"):
                    result = agent.invoke(
                        {"input": query},
                        config={"configurable": {"session_id": session_id}},
                    )
                    response = result.get("output") or str(result)
                    return response if response else fallback_response(query, user_context, stats)
                # Completion agent (Ollama without tool support)
                else:
                    return agent(query, session_id)
            except Exception as e:
                # LLM error — fall back to rule-based
                print(f"[Chat] LLM error: {str(e)}")
                fallback = fallback_response(query, user_context, stats)
                return fallback

        # No LLM configured — use rule-based fallback
        return fallback_response(query, user_context, stats)
    
    except Exception as e:
        # Catch any unexpected errors
        print(f"[Chat] Unexpected error in process_chat: {str(e)}")
        return f"I encountered an issue processing your request. Please try asking about beds, patients, or staff availability."
