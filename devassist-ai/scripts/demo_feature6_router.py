import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
from llm.router import LLMRouter
from llm.schemas import LLMRequest
from llm.registry import MODEL_REGISTRY, FALLBACK_CHAINS

def run_test():
    print("=" * 60)
    print("  DEVASSIST-AI: FEATURE 6 - MULTI-LLM ROUTER & FALLBACK TEST")
    print("=" * 60)

    router = LLMRouter()

    # Step 1: Normal Routing to primary configured model
    print("\n[Step 1] Testing Normal Routing (Primary Model: gemini-2.5-flash)...")
    req1 = LLMRequest(
        messages=[{"role": "user", "content": "Return a 1-sentence verification: DevAssist router is online."}],
        task_type="documentation",
        metadata={"model": "gemini-2.5-flash"}
    )
    resp1 = router.generate(req1)

    print(f"  -> Success: {resp1.success}")
    print(f"  -> Model Used: {resp1.model}")
    print(f"  -> Provider: {resp1.provider}")
    print(f"  -> Fallback Used: {resp1.fallback_used}")
    print(f"  -> Latency: {resp1.latency:.2f}s")
    print(f"  -> Output: {resp1.content.strip()[:120]}")

    # Step 2: Fallback Demonstration
    print("\n[Step 2] Testing Automatic Multi-Model Fallback...")
    print("  Injecting a failing model ('gemini-invalid-simulation') as first priority...")

    # Temporarily register the failing simulation model in registry
    MODEL_REGISTRY["gemini-invalid-simulation"] = {
        "provider": "gemini",
        "context_window": 32000,
        "supports_tools": True,
        "supports_json": True,
        "supports_vision": False,
    }

    # Request with simulated primary failure
    req2 = LLMRequest(
        messages=[{"role": "user", "content": "Return: Fallback succeeded."}],
        task_type="documentation",
        metadata={"model": "gemini-invalid-simulation"}
    )

    start = time.time()
    resp2 = router.generate(req2)
    elapsed = time.time() - start

    print(f"\n  -> Overall Call Success: {resp2.success}")
    print(f"  -> Model That Answered: {resp2.model}")
    print(f"  -> Provider: {resp2.provider}")
    print(f"  -> Fallback Activated: {resp2.fallback_used}")
    print(f"  -> Total Elapsed Time: {elapsed:.2f}s")
    print(f"  -> Output: {resp2.content.strip()[:120]}")

    # Clean up test model
    MODEL_REGISTRY.pop("gemini-invalid-simulation", None)

    print("\n" + "=" * 60)
    if resp1.success and resp2.success and resp2.fallback_used:
        print("  FEATURE 6 VERIFIED: ROUTER RESILIENCE & FALLBACK WORKING!")
    else:
        print("  FEATURE 6: Completed with issues.")
    print("=" * 60)

if __name__ == "__main__":
    run_test()
