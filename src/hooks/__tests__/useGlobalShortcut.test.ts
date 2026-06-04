// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGlobalShortcut } from "../useGlobalShortcut";

function fireKey(key: string, options: Partial<KeyboardEventInit> = {}): void {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
}

describe("useGlobalShortcut", () => {
  // Typed as a `() => void` mock so it satisfies the hook's handler param under
  // strict tsc (a bare `vi.fn()` widens to a Mock that isn't assignable to `() => void`).
  let handler: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    handler = vi.fn<() => void>();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("N 키 누르면 handler 호출", () => {
    renderHook(() => useGlobalShortcut("n", handler));
    fireKey("n");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("다른 키는 handler 호출 안 함", () => {
    renderHook(() => useGlobalShortcut("n", handler));
    fireKey("a");
    fireKey("b");
    expect(handler).not.toHaveBeenCalled();
  });

  it("metaKey + N → 무시", () => {
    renderHook(() => useGlobalShortcut("n", handler));
    fireKey("n", { metaKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("ctrlKey + N → 무시", () => {
    renderHook(() => useGlobalShortcut("n", handler));
    fireKey("n", { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("shiftKey + N → 무시", () => {
    renderHook(() => useGlobalShortcut("n", handler));
    fireKey("n", { shiftKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("altKey + N → 무시", () => {
    renderHook(() => useGlobalShortcut("n", handler));
    fireKey("n", { altKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("isComposing 중에는 무시 (IME)", () => {
    renderHook(() => useGlobalShortcut("n", handler));
    fireKey("n", { isComposing: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("input 포커스 중에는 무시", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useGlobalShortcut("n", handler));

    const event = new KeyboardEvent("keydown", { key: "n", bubbles: true });
    Object.defineProperty(event, "target", { value: input });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("textarea 포커스 중에는 무시", () => {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    renderHook(() => useGlobalShortcut("n", handler));

    const event = new KeyboardEvent("keydown", { key: "n", bubbles: true });
    Object.defineProperty(event, "target", { value: textarea });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it("contenteditable 요소 포커스 중에는 무시", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    document.body.appendChild(div);

    renderHook(() => useGlobalShortcut("n", handler));

    const event = new KeyboardEvent("keydown", { key: "n", bubbles: true });
    Object.defineProperty(event, "target", { value: div });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it("unmount 후 handler 호출 안 됨 (cleanup)", () => {
    const { unmount } = renderHook(() => useGlobalShortcut("n", handler));
    unmount();
    fireKey("n");
    expect(handler).not.toHaveBeenCalled();
  });

  it("select 포커스 중에는 무시", () => {
    const select = document.createElement("select");
    document.body.appendChild(select);

    renderHook(() => useGlobalShortcut("n", handler));

    const event = new KeyboardEvent("keydown", { key: "n", bubbles: true });
    Object.defineProperty(event, "target", { value: select });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(select);
  });

  it("handler 가 매 렌더마다 새로 만들어져도 listener 는 1번만 등록 (ref 안정성)", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const { rerender } = renderHook(({ h }: { h: () => void }) => useGlobalShortcut("n", h), {
      initialProps: { h: vi.fn() },
    });

    const initialAddCalls = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    rerender({ h: vi.fn() });
    rerender({ h: vi.fn() });
    const finalAddCalls = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;

    expect(finalAddCalls).toBe(initialAddCalls);
    expect(removeSpy.mock.calls.filter((c) => c[0] === "keydown").length).toBe(0);
  });

  it("ref 패턴: rerender 시 최신 handler 호출", () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const { rerender } = renderHook(({ h }: { h: () => void }) => useGlobalShortcut("n", h), {
      initialProps: { h: h1 },
    });

    rerender({ h: h2 });
    fireKey("n");

    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledOnce();
  });
});
